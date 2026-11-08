import { timingSafeEqual } from 'node:crypto';
import { get, put } from '@vercel/blob';

const ARTICLES_PATH = 'fita-regolamento/articles.json';
const MAX_BODY_SIZE = 2_000_000;

type ArticleSection = {
  id: string;
  subsections: Array<{ id: string; title: string; content: string }>;
  [key: string]: unknown;
};

async function readArticles() {
  const blob = await get(ARTICLES_PATH, { access: 'private', useCache: false });
  if (!blob) return { sections: null, etag: null };

  const text = await new Response(blob.stream).text();
  const data = JSON.parse(text) as { sections?: ArticleSection[] };
  if (!Array.isArray(data.sections)) throw new Error('Invalid shared article data');

  return { sections: data.sections, etag: blob.blob.etag };
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

function isAuthorizedAdmin(request: Request) {
  const expected = process.env.ARTICLE_SYNC_ADMIN_KEY;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\\s+/i, '');
  if (!expected || !supplied) return false;

  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
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
  if (!isAuthorizedAdmin(request)) {
    return Response.json({ error: 'Chiave amministratore non valida.' }, { status: 403, headers: noStoreHeaders() });
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStoreHeaders() });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_SIZE) {
    return Response.json({ error: 'Il contenuto supera il limite consentito.' }, { status: 413, headers: noStoreHeaders() });
  }

  try {
    const payload = await request.json() as { sections?: unknown; etag?: string | null };
    const serialized = JSON.stringify(payload.sections);
    if (!isValidSections(payload.sections) || serialized.length > MAX_BODY_SIZE) {
      return Response.json({ error: 'Formato degli articoli non valido.' }, { status: 400, headers: noStoreHeaders() });
    }

    const current = await readArticles();
    if ((payload.etag ?? null) !== current.etag) {
      return Response.json(current, { status: 409, headers: noStoreHeaders() });
    }

    try {
      const saved = await put(
        ARTICLES_PATH,
        JSON.stringify({ sections: payload.sections, updatedAt: new Date().toISOString() }),
        {
          access: 'private',
          allowOverwrite: true,
          contentType: 'application/json',
          cacheControlMaxAge: 60,
          ...(current.etag ? { ifMatch: current.etag } : {}),
        },
      );
      return Response.json({ etag: saved.etag }, { headers: noStoreHeaders() });
    } catch {
      const latest = await readArticles();
      if (latest.etag !== current.etag) {
        return Response.json(latest, { status: 409, headers: noStoreHeaders() });
      }
      throw new Error('Unable to save shared articles');
    }
  } catch {
    return Response.json(
      { error: 'Impossibile salvare gli articoli condivisi.' },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}
