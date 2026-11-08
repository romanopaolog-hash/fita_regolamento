import { auth, clerkClient } from '@clerk/nextjs/server';

const noStore = { 'Cache-Control': 'no-store, max-age=0' };
const PAGE_SIZE = 50;

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

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { response: Response.json({ error: 'Accesso richiesto.' }, { status: 401, headers: noStore }) };
  }

  const clerk = await clerkClient();
  const currentUser = await clerk.users.getUser(userId);
  if (currentUser.publicMetadata.role !== 'admin') {
    return { response: Response.json({ error: 'Permessi admin richiesti.' }, { status: 403, headers: noStore }) };
  }

  return { clerk, userId };
}

async function countAdmins(clerk: Awaited<ReturnType<typeof clerkClient>>) {
  let offset = 0;
  let count = 0;

  while (true) {
    const page = await clerk.users.getUserList({ limit: 100, offset });
    count += page.data.filter(user => user.publicMetadata.role === 'admin').length;
    if (page.data.length < 100) return count;
    offset += page.data.length;
  }
}

function publicUser(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>['users']['getUser']>>) {
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Utente',
    email: user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
      ?? user.emailAddresses[0]?.emailAddress
      ?? 'Email non disponibile',
    role: user.publicMetadata.role === 'admin' ? 'admin' : 'user',
    createdAt: user.createdAt,
  };
}

export async function GET(request: Request) {
  let access;
  try {
    access = await requireAdmin();
  } catch {
    return Response.json({ error: 'Impossibile caricare gli utenti.' }, { status: 503, headers: noStore });
  }
  if ('response' in access) return access.response;

  const rawOffset = Number(new URL(request.url).searchParams.get('offset') ?? 0);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;

  try {
    const allUsers = [];
    let cursor = 0;
    while (true) {
      const page = await access.clerk.users.getUserList({ limit: 100, offset: cursor });
      allUsers.push(...page.data);
      if (page.data.length < 100) break;
      cursor += page.data.length;
    }
    const users = allUsers
      .map(publicUser)
      .sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin')
        || a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
        || a.email.localeCompare(b.email, 'it', { sensitivity: 'base' }));
    return Response.json({
      users: users.slice(offset, offset + PAGE_SIZE),
      nextOffset: offset + PAGE_SIZE < users.length ? offset + PAGE_SIZE : null,
    }, { headers: noStore });
  } catch {
    return Response.json({ error: 'Impossibile caricare gli utenti.' }, { status: 503, headers: noStore });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStore });
  }

  let access;
  try {
    access = await requireAdmin();
  } catch {
    return Response.json({ error: 'Impossibile verificare i permessi admin.' }, { status: 503, headers: noStore });
  }
  if ('response' in access) return access.response;

  try {
    const body = await request.json() as { userId?: unknown; role?: unknown };
    if (typeof body.userId !== 'string' || !body.userId || (body.role !== 'admin' && body.role !== 'user')) {
      return Response.json({ error: 'Dati non validi.' }, { status: 400, headers: noStore });
    }
    if (body.userId === access.userId && body.role !== 'admin') {
      return Response.json({ error: 'Non puoi rimuovere il tuo ruolo admin.' }, { status: 400, headers: noStore });
    }

    const target = await access.clerk.users.getUser(body.userId);
    const wasAdmin = target.publicMetadata.role === 'admin';
    if (wasAdmin && body.role === 'user' && await countAdmins(access.clerk) <= 1) {
      return Response.json({ error: 'Deve rimanere almeno un admin.' }, { status: 409, headers: noStore });
    }

    const updated = await access.clerk.users.updateUserMetadata(body.userId, {
      publicMetadata: { ...target.publicMetadata, role: body.role },
    });
    return Response.json({ user: publicUser(updated) }, { headers: noStore });
  } catch {
    return Response.json({ error: 'Impossibile aggiornare il ruolo dell’utente.' }, { status: 503, headers: noStore });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStore });
  }

  let access;
  try {
    access = await requireAdmin();
  } catch {
    return Response.json({ error: 'Impossibile verificare i permessi admin.' }, { status: 503, headers: noStore });
  }
  if ('response' in access) return access.response;

  try {
    const body = await request.json() as { userId?: unknown };
    if (typeof body.userId !== 'string' || !body.userId) {
      return Response.json({ error: 'Utente non valido.' }, { status: 400, headers: noStore });
    }
    if (body.userId === access.userId) {
      return Response.json({ error: 'Non puoi eliminare il tuo account da questa sezione.' }, { status: 400, headers: noStore });
    }

    const target = await access.clerk.users.getUser(body.userId);
    if (target.publicMetadata.role === 'admin' && await countAdmins(access.clerk) <= 1) {
      return Response.json({ error: 'Deve rimanere almeno un admin.' }, { status: 409, headers: noStore });
    }

    await access.clerk.users.deleteUser(body.userId);
    return Response.json({ deletedUserId: body.userId }, { headers: noStore });
  } catch {
    return Response.json({ error: 'Impossibile eliminare l’utente.' }, { status: 503, headers: noStore });
  }
}
