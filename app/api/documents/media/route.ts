import { del, get, put } from '@vercel/blob';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAccountApproved } from '../../../../lib/account-approval';

const DOCUMENT_PREFIX = 'fita-regolamento/documents/';
const MAX_DOCUMENT_SIZE = 4 * 1024 * 1024;
const noStore = { 'Cache-Control': 'no-store, max-age=0' };
const allowedExtensions = new Set(['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'txt']);

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try { return new URL(origin).host.toLowerCase() === host.toLowerCase(); } catch { return false; }
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
  if (!sameOrigin(request)) return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStore });
  try {
    const access = await getApprovedUser();
    if ('response' in access) return access.response;
    if (access.user.publicMetadata.role !== 'admin') {
      return Response.json({ error: 'Permessi admin richiesti.' }, { status: 403, headers: noStore });
    }
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_DOCUMENT_SIZE + 64 * 1024) {
      return Response.json({ error: 'Il file supera il limite di 4 MB.' }, { status: 413, headers: noStore });
    }
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: 'Seleziona un documento valido.' }, { status: 400, headers: noStore });
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return Response.json({ error: 'Il file supera il limite di 4 MB.' }, { status: 413, headers: noStore });
    }
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.has(extension)) {
      return Response.json({ error: 'Formato non supportato. Carica un PDF, PowerPoint, Word, Excel o TXT.' }, { status: 400, headers: noStore });
    }
    const safeExtension = extension.replace(/[^a-z0-9]/g, '');
    const blob = await put(`${DOCUMENT_PREFIX}${crypto.randomUUID()}.${safeExtension}`, file, {
      access: 'private',
      addRandomSuffix: true,
      contentType: file.type || 'application/octet-stream',
      cacheControlMaxAge: 60,
    });
    const url = `/api/documents/media?pathname=${encodeURIComponent(blob.pathname)}&filename=${encodeURIComponent(file.name)}`;
    return Response.json({ url, fileName: file.name, format: extension.toUpperCase() }, { headers: noStore });
  } catch (error) {
    console.error('[documents] upload failed', error);
    return Response.json({ error: 'Impossibile caricare il documento.' }, { status: 503, headers: noStore });
  }
}

export async function GET(request: Request) {
  try {
    const access = await getApprovedUser();
    if ('response' in access) return access.response;
    const url = new URL(request.url);
    const pathname = url.searchParams.get('pathname');
    const filename = url.searchParams.get('filename') || 'documento';
    if (!pathname || !pathname.startsWith(DOCUMENT_PREFIX) || pathname.includes('..') || pathname.includes('\\')) {
      return new Response('Documento non valido.', { status: 400, headers: noStore });
    }
    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200) return new Response('Documento non trovato.', { status: 404, headers: noStore });
    const safeName = filename.replace(/[\r\n"]/g, '_');
    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="documento"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[documents] download failed', error);
    return new Response('Impossibile scaricare il documento.', { status: 503, headers: noStore });
  }
}


export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStore });
  }
  try {
    const access = await getApprovedUser();
    if ('response' in access) return access.response;
    if (access.user.publicMetadata.role !== 'admin') {
      return Response.json({ error: 'Permessi admin richiesti.' }, { status: 403, headers: noStore });
    }
    const payload = await request.json() as { pathname?: unknown };
    const pathname = payload.pathname;
    if (typeof pathname !== 'string' || !pathname.startsWith(DOCUMENT_PREFIX) || pathname.includes('..') || pathname.includes('\\')) {
      return Response.json({ error: 'Documento non valido.' }, { status: 400, headers: noStore });
    }
    await del(pathname);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    console.error('[documents] delete failed', error);
    return Response.json({ error: 'Impossibile eliminare il file online.' }, { status: 503, headers: noStore });
  }
}
