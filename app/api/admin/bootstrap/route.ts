import { auth, clerkClient } from '@clerk/nextjs/server';

const noStore = { 'Cache-Control': 'no-store, max-age=0' };

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStore });
  }

  try {
    if (new URL(origin).host !== host) {
      return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStore });
    }
  } catch {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403, headers: noStore });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Accesso richiesto.' }, { status: 401, headers: noStore });
  }

  const adminEmail = process.env.FITA_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return Response.json({ error: 'Configurazione admin non disponibile.' }, { status: 503, headers: noStore });
  }

  try {
    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(userId);
    const verifiedEmail = currentUser.emailAddresses.find(
      email => email.id === currentUser.primaryEmailAddressId && email.verification?.status === 'verified',
    );

    if (!verifiedEmail || verifiedEmail.emailAddress.trim().toLowerCase() !== adminEmail) {
      return Response.json({ error: 'Non autorizzato.' }, { status: 403, headers: noStore });
    }

    if (currentUser.publicMetadata.role !== 'admin') {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { role: 'admin' },
      });
    }

    return Response.json({ role: 'admin' }, { headers: noStore });
  } catch {
    return Response.json({ error: 'Impossibile aggiornare il ruolo.' }, { status: 503, headers: noStore });
  }
}
