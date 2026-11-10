import { createCipheriv, createECDH, createHash, createPrivateKey, generateKeyPairSync, hkdfSync, randomBytes, sign } from 'node:crypto';
import { del, get, list, put } from '@vercel/blob';
import { clerkClient } from '@clerk/nextjs/server';
import { isAccountApproved } from './account-approval';

const keyPath = 'fita-regolamento/push/vapid.json';
const devicePrefix = 'fita-regolamento/push/devices/';
type Keys = { publicKey: string; privateKey: string };
type SubscriptionKeys = { p256dh: string; auth: string };
type Device = { userId: string; endpoint: string; subscriptionKeys?: SubscriptionKeys };
type NewsNotice = { id: string; category: string; title: string };

export function parsePushSubscriptionKeys(value: unknown): SubscriptionKeys | null {
  if (!value || typeof value !== 'object') return null;
  const { p256dh, auth } = value as Partial<SubscriptionKeys>;
  if (typeof p256dh !== 'string' || !/^[A-Za-z0-9_-]{87}$/.test(p256dh) ||
      typeof auth !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(auth)) return null;
  const point = Buffer.from(p256dh, 'base64url');
  if (point.length !== 65 || point[0] !== 4 || Buffer.from(auth, 'base64url').length !== 16) return null;
  try {
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    ecdh.computeSecret(point);
    return { p256dh, auth };
  } catch {
    return null;
  }
}

// RFC 8291 and RFC 8188, one final aes128gcm record.
function encryptNotice(payload: Buffer, keys: SubscriptionKeys) {
  const recipient = Buffer.from(keys.p256dh, 'base64url');
  const secret = Buffer.from(keys.auth, 'base64url');
  const ecdh = createECDH('prime256v1');
  const sender = ecdh.generateKeys();
  const shared = ecdh.computeSecret(recipient);
  const salt = randomBytes(16);
  const info = Buffer.concat([Buffer.from('WebPush: info\0'), recipient, sender]);
  const ikm = Buffer.from(hkdfSync('sha256', shared, secret, info, 32));
  const key = Buffer.from(hkdfSync('sha256', ikm, salt, 'Content-Encoding: aes128gcm\0', 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, 'Content-Encoding: nonce\0', 12));
  const header = Buffer.alloc(21);
  salt.copy(header);
  header.writeUInt32BE(4096, 16);
  header[20] = sender.length;
  const cipher = createCipheriv('aes-128-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.update(Buffer.from([2])), cipher.final()]);
  return new Uint8Array(Buffer.concat([header, sender, ciphertext, cipher.getAuthTag()]));
}

async function readJson<T>(path: string): Promise<T | null> {
  const blob = await get(path, { access: 'private', useCache: false });
  return blob ? await new Response(blob.stream).json() as T : null;
}

export async function pushKeys(create = false): Promise<Keys | null> {
  const existing = await readJson<Keys>(keyPath);
  if (existing || !create) return existing;
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = publicKey.export({ format: 'jwk' });
  if (!jwk.x || !jwk.y) throw new Error('Missing push key coordinates');
  const keys = {
    publicKey: Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url'),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
  try {
    await put(keyPath, JSON.stringify(keys), { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json' });
    return keys;
  } catch (error) {
    const created = await readJson<Keys>(keyPath);
    if (created) return created;
    throw error;
  }
}

export function validPushEndpoint(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash) return null;
    const { hostname, pathname } = url;
    if (
      (hostname === 'fcm.googleapis.com' && pathname.startsWith('/fcm/send/')) ||
      (hostname === 'updates.push.services.mozilla.com' && pathname.startsWith('/wpush/')) ||
      ((hostname === 'web.push.apple.com' || hostname.endsWith('.web.push.apple.com')) && pathname.length > 1) ||
      (hostname.endsWith('.notify.windows.com') && pathname.startsWith('/w/'))
    ) return url;
  } catch {}
  return null;
}

export async function registerPushDevice(userId: string, endpoint: URL, subscriptionKeys: SubscriptionKeys) {
  const path = devicePrefix + createHash('sha256').update(endpoint.href).digest('hex') + '.json';
  await put(path, JSON.stringify({ userId, endpoint: endpoint.href, subscriptionKeys }), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
  });
}

export async function sendNewsPush(notice: NewsNotice) {
  const payload = Buffer.from(JSON.stringify({
    id: notice.id.slice(0, 120), category: notice.category.slice(0, 60), title: notice.title.slice(0, 250),
  }));
  const topic = createHash('sha256').update(notice.id).digest('base64url').slice(0, 32);
  const keys = await pushKeys();
  if (!keys) return;
  const privateKey = createPrivateKey(keys.privateKey);
  const clerk = await clerkClient();
  const consent = new Map<string, Promise<boolean>>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: devicePrefix, limit: 50, cursor });
    for (let offset = 0; offset < page.blobs.length; offset += 10) {
      await Promise.allSettled(page.blobs.slice(offset, offset + 10).map(async blob => {
        const device = await readJson<Device>(blob.pathname);
        if (!device) return;
        const endpoint = validPushEndpoint(device.endpoint);
        if (!endpoint) return;
        if (!consent.has(device.userId)) {
          consent.set(device.userId, clerk.users.getUser(device.userId)
            .then(user => isAccountApproved(user))
            .catch(() => false));
        }
        if (!(await consent.get(device.userId))) return;
        const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
        const jwt = encode({ typ: 'JWT', alg: 'ES256' }) + '.' + encode({
          aud: endpoint.origin,
          exp: Math.floor(Date.now() / 1000) + 3600,
          sub: 'https://fita-regolamento.vercel.app',
        });
        const signature = sign('sha256', Buffer.from(jwt), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
        const body = device.subscriptionKeys ? encryptNotice(payload, device.subscriptionKeys) : undefined;
        const response = await fetch(endpoint, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
          body,
          headers: {
            TTL: '86400', Topic: topic, Authorization: 'vapid t=' + jwt + '.' + signature + ', k=' + keys.publicKey,
            ...(body ? { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream' } : {}),
          },
        });
        if (response.status === 404 || response.status === 410) {
          // Keep the record if it was replaced since we read it.
          const current = await readJson<Device>(blob.pathname);
          if (current?.userId === device.userId && current?.endpoint === device.endpoint) await del(blob.url);
        } else if (!response.ok) {
          console.warn('[news-push] Push service rejected delivery', response.status);
        }
      }));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
