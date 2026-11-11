import { del, get, list, put } from '@vercel/blob';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAccountApproved } from '../../../lib/account-approval';
import { readArticles } from '../../../lib/article-archive';
import { ARTICLE_REPORT_MAX_LENGTH, type ArticleReport } from '../../../lib/article-report';
import { isDemoArticle } from '../../../lib/demo-articles';

const prefix = 'fita-regolamento/article-reports/';
const noStore = { 'Cache-Control': 'no-store' };
const reportIdPattern = /^\d{13}-[a-f0-9-]{36}$/;

function fail(error: string, status: number) {
  return Response.json({ error }, { status, headers: noStore });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  try { return Boolean(origin && host && new URL(origin).host === host); }
  catch { return false; }
}

async function currentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const clerk = await clerkClient();
  return clerk.users.getUser(userId);
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('Richiesta non valida.', 403);
  try {
    const user = await currentUser();
    if (!user) return fail('Accedi per inviare una segnalazione.', 401);
    if (!isAccountApproved(user)) return fail('Serve un account approvato.', 403);

    if (Number(request.headers.get('content-length') ?? 0) > 14_000) return fail('La segnalazione è troppo lunga.', 413);
    const raw = await request.text();
    if (raw.length > 14_000) return fail('La segnalazione è troppo lunga.', 413);
    const body = JSON.parse(raw) as Record<string, unknown> | null;
    const articleId = body?.articleId;
    const kind = body?.kind;
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (typeof articleId !== 'string' || !articleId || articleId.length > 200 ||
        (kind !== 'errore' && kind !== 'suggerimento') || !message || message.length > ARTICLE_REPORT_MAX_LENGTH) {
      return fail('Controlla i dati della segnalazione.', 400);
    }

    const { sections } = await readArticles();
    const section = sections?.find(item => (!item.hidden || user.publicMetadata.role === 'admin') &&
      item.subsections.some(article => article.id === articleId));
    const article = section?.subsections.find(item => item.id === articleId);
    if (!section || !article || isDemoArticle(article.id) || (article.hidden && user.publicMetadata.role !== 'admin')) {
      return fail('Questo articolo non è più disponibile.', 404);
    }

    const createdAt = Date.now();
    const report: ArticleReport = {
      id: String(9_999_999_999_999 - createdAt).padStart(13, '0') + '-' + crypto.randomUUID(),
      articleId,
      articleTitle: article.title,
      sectionTitle: typeof section.title === 'string' ? section.title : '',
      authorName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Utente',
      kind,
      message,
      createdAt,
    };

    await put(prefix + report.id + '.json', JSON.stringify(report), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false,
    });
    return Response.json({ id: report.id }, { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof SyntaxError) return fail('Richiesta non valida.', 400);
    return fail('Non è stato possibile inviare la segnalazione. Riprova.', 503);
  }
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return fail('Accesso richiesto.', 401);
    if (user.publicMetadata.role !== 'admin') return fail('Permessi admin richiesti.', 403);

    const cursor = new URL(request.url).searchParams.get('cursor') ?? undefined;
    const page = await list({ prefix, cursor, limit: 20 });
    const reports = await Promise.all(page.blobs.map(async item => {
      const blob = await get(item.pathname, { access: 'private', useCache: false });
      return blob?.statusCode === 200 ? await new Response(blob.stream).json() as ArticleReport : null;
    }));
    return Response.json({
      reports: reports.filter(item => item !== null).sort((a, b) => b.createdAt - a.createdAt),
      nextCursor: page.hasMore ? page.cursor : null,
    }, { headers: noStore });
  } catch {
    return fail('Non è stato possibile caricare le segnalazioni.', 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return fail('Richiesta non valida.', 403);
  try {
    const user = await currentUser();
    if (!user) return fail('Accesso richiesto.', 401);
    if (user.publicMetadata.role !== 'admin') return fail('Permessi admin richiesti.', 403);

    const id = new URL(request.url).searchParams.get('id');
    if (!id || !reportIdPattern.test(id)) return fail('Segnalazione non valida.', 400);
    const blob = await get(prefix + id + '.json', { access: 'private', useCache: false });
    if (blob?.statusCode === 200) await del(blob.blob.url);
    return Response.json({ ok: true }, { headers: noStore });
  } catch {
    return fail('Non è stato possibile cancellare la segnalazione.', 503);
  }
}
