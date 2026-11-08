import { BlobPreconditionFailedError, get, head, put } from '@vercel/blob';
import { auth, clerkClient } from '@clerk/nextjs/server';

const ARTICLES_PATH = 'fita-regolamento/articles.json';
const MAX_BODY_SIZE = 2_000_000;

type ArticleSection = {
  id: string;
  subsections: Array<{ id: string; title: string; content: string }>;
  [key: string]: unknown;
};

async function readArticles() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const metadata = await head(ARTICLES_PATH, { access: 'private' });
    if (!metadata) return { sections: null, etag: null };

    const blob = await get(ARTICLES_PATH, { access: 'private', useCache: false });
    if (!blob) continue;

    const latestMetadata = await head(ARTICLES_PATH, { access: 'private' });
    if (metadata.etag !== blob.blob.etag || metadata.etag !== latestMetadata?.etag) continue;

    const text = await new Response(blob.stream).text();
    const data = JSON.parse(text) as { sections?: ArticleSection[] };
    if (!Array.isArray(data.sections)) throw new Error('Invalid shared article data');

    return { sections: data.sections, etag: metadata.etag };
  }

  throw new Error('Shared article archive changed while reading');
}

function isValidSections(value: unknown): value is ArticleSection[] {
  if (!Array.isArray(value) || value.length > 100) return false;
  return value.every(section =>
    section !== null
    && typeof section === 'object'
    && typeof section.id === 'string'
    && Array.isArray(section.subsections)
    && section.subsections.length <= 5000
    && section.subsections.every((article: unknown) =>
      article !== null
      && typeof article === 'object'
      && typeof (article as { id?: unknown }).id === 'string'
      && typeof (article as { title?: unknown }).title === 'string'
      && typeof (article as { content?: unknown }).content === 'string'
    )
  );
}

function noStoreHeaders() {
  return { 'Cache-Control': 'no-store, max-age=0' };
}

export async function GET() {
  try {
    return Response.json(await readArticles(), { headers: noStoreHeaders() });
  } catch {
    return Response.json(
      { error: 'Impossibile leggere gli articoli condivisi.' },
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
    if (admin.publicMetadata.role !== 'admin') {
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
    const payload = await request.json() as { sections?: unknown; etag?: string | null };
    const serialized = JSON.stringify(payload.sections);
    if (!isValidSections(payload.sections) || serialized.length > MAX_BODY_SIZE) {
      return Response.json({ error: 'Formato degli articoli non valido.' }, { status: 400, headers: noStoreHeaders() });
    }

    stage = 'lettura archivio Blob';
    const current = await readArticles();
    if ((payload.etag ?? null) !== current.etag) {
      return Response.json(current, { status: 409, headers: noStoreHeaders() });
    }

    stage = 'lettura metadati Blob';
    const metadata = await head(ARTICLES_PATH, { access: 'private' });
    if ((metadata?.etag ?? null) !== current.etag) {
      const latest = await readArticles();
      return Response.json(latest, { status: 409, headers: noStoreHeaders() });
    }

    stage = 'scrittura archivio Blob';
    try {
      const saved = await put(
        ARTICLES_PATH,
        JSON.stringify({ sections: payload.sections, updatedAt: new Date().toISOString() }),
        {
          access: 'private',
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 60,
          ...(metadata?.etag ? { ifMatch: metadata.etag } : {}),
        },
      );
      return Response.json({ etag: saved.etag }, { headers: noStoreHeaders() });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        const latest = await readArticles();
        return Response.json(latest, { status: 409, headers: noStoreHeaders() });
      }
      console.error('[articles] Blob write exception', error);
      throw error;
    }
  } catch (error) {
    console.error(`[articles] save failed during ${stage}`, error);
    return Response.json(
      { error: 'Impossibile salvare gli articoli condivisi.', stage },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}
