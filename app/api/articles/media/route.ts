import { get, put } from '@vercel/blob';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAccountApproved } from '../../../../lib/account-approval';

const MEDIA_PREFIX = 'fita-regolamento/media/';
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
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

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_IMAGE_SIZE + 64 * 1024) {
      return Response.json({ error: 'L’immagine supera il limite di 4 MB.' }, { status: 413, headers: noStore });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
      return Response.json({ error: 'Seleziona o incolla un file immagine.' }, { status: 400, headers: noStore });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return Response.json({ error: 'L’immagine supera il limite di 4 MB.' }, { status: 413, headers: noStore });
    }

    const extension = file.type.split('/')[1]?.replace(/[^a-zA-Z0-9+.-]/g, '') || 'img';
    const blob = await put(
      `${MEDIA_PREFIX}${crypto.randomUUID()}.${extension}`,
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
    return Response.json({ error: 'Impossibile caricare l’immagine.' }, { status: 503, headers: noStore });
  }
}

export async function GET(request: Request) {
  try {
    const access = await getApprovedUser();
    if ('response' in access) return access.response;

    const pathname = new URL(request.url).searchParams.get('pathname');
    if (!pathname || !pathname.startsWith(MEDIA_PREFIX) || pathname.includes('..') || pathname.includes('\\')) {
      return Response.json({ error: 'Immagine non valida.' }, { status: 400, headers: noStore });
    }

    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200) {
      return new Response('Immagine non trovata.', { status: 404, headers: noStore });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[article-media] read failed', error);
    return new Response('Impossibile leggere l’immagine.', { status: 503, headers: noStore });
  }
}
