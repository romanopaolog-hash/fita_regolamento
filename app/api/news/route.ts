import { after } from 'next/server';
import { sendNewsPush } from '../../../lib/news-push';

import { BlobPreconditionFailedError, get, head, put } from '@vercel/blob';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAccountApproved } from '../../../lib/account-approval';

export const maxDuration = 60;

const NEWS_PATH = 'fita-regolamento/news.json';
const MAX_BODY_SIZE = 1_000_000;

type NewsItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  content: string;
  image: string | null;
  isPinned: boolean;
  publishedAt?: string;
};

async function readNews() {
  const blob = await get(NEWS_PATH, { access: 'private', useCache: false });
  if (!blob) return { news: null, etag: null, url: null };

  const text = await new Response(blob.stream).text();
  const data = JSON.parse(text) as { news?: NewsItem[] };
  if (!Array.isArray(data.news)) throw new Error('Invalid shared news data');

  const metadata = await head(blob.blob.url);
  return { news: data.news, etag: metadata.etag, url: blob.blob.url };
}

function isValidNews(value: unknown): value is NewsItem[] {
  return Array.isArray(value) && value.length <= 500 && value.every(item =>
    item !== null
    && typeof item === 'object'
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.category === 'string'
    && typeof item.date === 'string'
    && typeof item.location === 'string'
    && typeof item.content === 'string'
    && (typeof item.image === 'string' || item.image === null)
    && typeof item.isPinned === 'boolean'
  );
}

function noStoreHeaders() {
  return { 'Cache-Control': 'no-store, max-age=0' };
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Accesso richiesto.' }, { status: 401, headers: noStoreHeaders() });
    }

    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(userId);
    if (!isAccountApproved(currentUser)) {
      return Response.json({ error: 'La richiesta di accesso è in attesa di approvazione.' }, { status: 403, headers: noStoreHeaders() });
    }

    const { news, etag } = await readNews();
    return Response.json({ news, etag }, { headers: noStoreHeaders() });
  } catch {
    return Response.json(
      { error: 'Impossibile leggere le news condivise.' },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}

export async function PUT(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStoreHeaders() });
  }
  try {
    if (new URL(origin).host !== host) {
      return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStoreHeaders() });
    }
  } catch {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStoreHeaders() });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Accesso richiesto.' }, { status: 401, headers: noStoreHeaders() });
  }

  try {
    const clerk = await clerkClient();
    const admin = await clerk.users.getUser(userId);
    if (admin.publicMetadata.role !== 'admin' || !isAccountApproved(admin)) {
      return Response.json({ error: 'Permessi admin richiesti.' }, { status: 403, headers: noStoreHeaders() });
    }
  } catch {
    return Response.json({ error: 'Impossibile verificare i permessi admin.' }, { status: 503, headers: noStoreHeaders() });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_SIZE) {
    return Response.json({ error: 'Il contenuto supera il limite consentito.' }, { status: 413, headers: noStoreHeaders() });
  }

  let stage = 'validazione richiesta';
  try {
    const payload = await request.json() as { news?: unknown; etag?: string | null };
    const serialized = JSON.stringify(payload.news);
    if (!isValidNews(payload.news) || serialized.length > MAX_BODY_SIZE) {
      return Response.json({ error: 'Formato delle news non valido.' }, { status: 400, headers: noStoreHeaders() });
    }

    stage = 'lettura archivio Blob';
    const current = await readNews();
    if ((payload.etag ?? null) !== current.etag) {
      return Response.json(current, { status: 409, headers: noStoreHeaders() });
    }

    stage = 'lettura metadati Blob';
    const metadata = current.url ? await head(current.url) : null;
    if ((metadata?.etag ?? null) !== current.etag) {
      const latest = await readNews();
      return Response.json(latest, { status: 409, headers: noStoreHeaders() });
    }

    stage = 'scrittura archivio Blob';
    try {
      const saved = await put(
        NEWS_PATH,
        JSON.stringify({ news: payload.news, updatedAt: new Date().toISOString() }),
        {
          access: 'private',
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 60,
          ...(metadata?.etag ? { ifMatch: metadata.etag } : {}),
        },
      );
      const previousIds = new Set(current.news?.map(item => item.id));
      if (payload.news.some(item => !previousIds.has(item.id) && typeof item.publishedAt === 'string')) {
        after(async () => {
          try { await sendNewsPush(); }
          catch { console.warn('[news-push] Dispatch failed'); }
        });
      }
      return Response.json({ etag: saved.etag }, { headers: noStoreHeaders() });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        const latest = await readNews();
        return Response.json(latest, { status: 409, headers: noStoreHeaders() });
      }
      console.error('[news] Blob write exception', error);
      throw error;
    }
  } catch (error) {
    console.error(`[news] save failed during ${stage}`, error);
    return Response.json(
      { error: 'Impossibile salvare le news condivise.', stage },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}
