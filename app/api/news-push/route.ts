import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAccountApproved } from '../../../lib/account-approval';
import { parsePushSubscriptionKeys, pushKeys, registerPushDevice, validPushEndpoint } from '../../../lib/news-push';

const headers = { 'Cache-Control': 'no-store' };

async function pushUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  return isAccountApproved(user) ? user : null;
}

export async function GET() {
  try {
    if (!(await pushUser())) return Response.json({ error: 'Accedi con un account approvato per attivare le notifiche.' }, { status: 403, headers });
    const keys = await pushKeys(true);
    return Response.json({ publicKey: keys?.publicKey }, { headers });
  } catch {
    return Response.json({ error: 'Le notifiche push non sono disponibili al momento.' }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers });
  }
  try {
    const user = await pushUser();
    if (!user) return Response.json({ error: 'Accedi con un account approvato per attivare le notifiche.' }, { status: 403, headers });
    const body = await request.text();
    if (body.length > 3000) return Response.json({ error: 'Richiesta troppo grande.' }, { status: 413, headers });
    const subscription = JSON.parse(body);
    const endpoint = validPushEndpoint(subscription?.endpoint);
    const keys = parsePushSubscriptionKeys(subscription?.keys);
    if (!endpoint) return Response.json({ error: 'Il servizio push di questo browser non è supportato.' }, { status: 400, headers });
    if (!keys) return Response.json({ error: 'Chiavi del dispositivo non valide.' }, { status: 400, headers });
    await registerPushDevice(user.id, endpoint, keys);
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ error: 'Impossibile attivare le notifiche push.' }, { status: 503, headers });
  }
}
