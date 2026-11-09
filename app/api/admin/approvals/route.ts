import { auth, clerkClient } from '@clerk/nextjs/server';
import { getAccountApprovalStatus } from '../../../../lib/account-approval';

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

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { response: Response.json({ error: 'Accesso richiesto.' }, { status: 401, headers: noStore }) };

  const clerk = await clerkClient();
  const currentUser = await clerk.users.getUser(userId);
  if (currentUser.publicMetadata.role !== 'admin') {
    return { response: Response.json({ error: 'Permessi admin richiesti.' }, { status: 403, headers: noStore }) };
  }
  return { clerk };
}

function toRequest(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>['users']['getUser']>>) {
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Utente',
    email: user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
      ?? user.emailAddresses[0]?.emailAddress
      ?? 'Email non disponibile',
    createdAt: user.createdAt,
    status: getAccountApprovalStatus(user),
  };
}

export async function GET() {
  let access;
  try {
    access = await requireAdmin();
  } catch {
    return Response.json({ error: 'Impossibile verificare i permessi admin.' }, { status: 503, headers: noStore });
  }
  if ('response' in access) return access.response;

  try {
    const allUsers = [];
    let offset = 0;
    while (true) {
      const page = await access.clerk.users.getUserList({ limit: 100, offset });
      allUsers.push(...page.data);
      if (page.data.length < 100) break;
      offset += page.data.length;
    }

    const requests = allUsers
      .filter(user => user.publicMetadata.role !== 'admin')
      .map(toRequest)
      .filter(user => user.status === 'pending' || user.status === 'rejected')
      .sort((a, b) => a.createdAt - b.createdAt);

    return Response.json({ requests }, { headers: noStore });
  } catch {
    return Response.json({ error: 'Impossibile caricare le richieste di accesso.' }, { status: 503, headers: noStore });
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
    const body = await request.json() as { userId?: unknown; action?: unknown };
    if (typeof body.userId !== 'string' || !body.userId || (body.action !== 'approve' && body.action !== 'reject')) {
      return Response.json({ error: 'Dati non validi.' }, { status: 400, headers: noStore });
    }

    const target = await access.clerk.users.getUser(body.userId);
    const status = getAccountApprovalStatus(target);
    if (target.publicMetadata.role === 'admin' || status === 'approved') {
      return Response.json({ error: 'Questo account non ha una richiesta in attesa.' }, { status: 409, headers: noStore });
    }

    const approvalStatus = body.action === 'approve' ? 'approved' : 'rejected';
    const updated = await access.clerk.users.updateUserMetadata(body.userId, {
      publicMetadata: { ...target.publicMetadata, approvalStatus },
    });

    return Response.json({ request: toRequest(updated) }, { headers: noStore });
  } catch {
    return Response.json({ error: 'Impossibile aggiornare la richiesta.' }, { status: 503, headers: noStore });
  }
}
