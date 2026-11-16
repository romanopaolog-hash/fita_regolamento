import { get, put } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { ARTICLE_MEDIA_MAX_BYTES, ARTICLE_MEDIA_PREFIX, ARTICLE_MEDIA_TYPES } from '../../../../lib/article-media';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAccountApproved } from '../../../../lib/account-approval';

const MAX_MEDIA_SIZE = 4 * 1024 * 1024;
const noStore = { 'Cache-Control': 'no-store, max-age=0' };

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

async function getApprovedUser() {
  const { userId } = await auth();
  if (!userId) return { response: Response.json({ error: 'Accesso richiesto.' }, { status: 401, headers: noStore }) };

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  if (!isAccountApproved(user)) {
    return { response: Response.json({ error: 'Il tuo account è in attesa di approvazione.' }, { status: 403, headers: noStore }) };
  }
  return { clerk, user };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStore });
  }

  try {
    const access = await getApprovedUser();
    if ('response' in access) return access.response;
    if (access.user.publicMetadata.role !== 'admin') {
      return Response.json({ error: 'Permessi admin richiesti.' }, { status: 403, headers: noStore });
    }

    if (request.headers.get('content-type')?.startsWith('application/json')) {
      const body = await request.json() as HandleUploadBody;
      if (body.type !== 'blob.generate-client-token') {
        return Response.json({ error: 'Richiesta non valida.' }, { status: 400, headers: noStore });
      }
      const response = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async pathname => {
          const filename = pathname.slice(ARTICLE_MEDIA_PREFIX.length);
          if (!pathname.startsWith(ARTICLE_MEDIA_PREFIX) || !/^[a-f0-9-]{36}\.[a-z0-9]+$/.test(filename)) {
            throw new Error('Percorso del file non valido.');
          }
          return {
            allowedContentTypes: Object.values(ARTICLE_MEDIA_TYPES),
            maximumSizeInBytes: ARTICLE_MEDIA_MAX_BYTES,
            addRandomSuffix: true,
            cacheControlMaxAge: 60,
          };
        },
      });
      return Response.json(response, { headers: noStore });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_MEDIA_SIZE + 64 * 1024) {
      return Response.json({ error: 'Il file supera il limite di 4 MB.' }, { status: 413, headers: noStore });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || !(file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      return Response.json({ error: 'Seleziona un’immagine o un video.' }, { status: 400, headers: noStore });
    }
    if (file.size > MAX_MEDIA_SIZE) {
      return Response.json({ error: 'Il file supera il limite di 4 MB.' }, { status: 413, headers: noStore });
    }

    const extension = file.type.split('/')[1]?.replace(/[^a-zA-Z0-9+.-]/g, '') || 'img';
    const blob = await put(
      `${ARTICLE_MEDIA_PREFIX}${crypto.randomUUID()}.${extension}`,
      file,
      {
        access: 'private',
        addRandomSuffix: true,
        contentType: file.type,
        cacheControlMaxAge: 60,
      },
    );

    const url = `/api/articles/media?pathname=${encodeURIComponent(blob.pathname)}`;
    return Response.json({ url, pathname: blob.pathname }, { headers: noStore });
  } catch (error) {
    console.error('[article-media] upload failed', error);
    return Response.json({ error: 'Impossibile caricare il file.' }, { status: 503, headers: noStore });
  }
}

export async function GET(request: Request) {
  try {
    const access = await getApprovedUser();
    if ('response' in access) return access.response;

    const pathname = new URL(request.url).searchParams.get('pathname');
    if (!pathname || !pathname.startsWith(ARTICLE_MEDIA_PREFIX) || pathname.includes('..') || pathname.includes('\\')) {
      return Response.json({ error: 'File non valido.' }, { status: 400, headers: noStore });
    }

    const range = request.headers.get('range');
    const result = await get(pathname, {
      access: 'private',
      headers: range && /^bytes=\d*-\d*$/.test(range) ? { Range: range } : undefined,
      abortSignal: request.signal,
    });
    if (!result || result.statusCode !== 200) {
      return new Response('File non trovato.', { status: 404, headers: noStore });
    }

    const headers = new Headers({
      'Content-Type': result.blob.contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    for (const name of ['content-length', 'content-range', 'accept-ranges']) {
      const value = result.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(result.stream, { headers, status: headers.has('content-range') ? 206 : 200 });
  } catch (error) {
    console.error('[article-media] read failed', error);
    return new Response('Impossibile leggere il file.', { status: 503, headers: noStore });
  }
}
