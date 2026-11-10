'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { UserProfile, useClerk, useUser } from '@clerk/nextjs';

import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react';
import { formatPersonName } from '../../lib/format-person-name';

const regions = [
  'Campania', 'Lazio', 'Lombardia', 'Piemonte', 'Sicilia',
  'Veneto', 'Emilia-Romagna', 'Puglia', 'Toscana',
];

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: number;
};

export default function ProfileCenter() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [region, setRegion] = useState('Campania');
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [regionMessage, setRegionMessage] = useState('');
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [nextUsersOffset, setNextUsersOffset] = useState<number | null>(null);
  const [userActionId, setUserActionId] = useState('');
  const [usersMessage, setUsersMessage] = useState('');
  const [usersError, setUsersError] = useState('');
  const isAdmin = user?.publicMetadata.role === 'admin';

  const loadUsers = useCallback(async (offset = 0, append = false) => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const response = await fetch(`/api/admin/users?offset=${offset}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossibile caricare gli utenti.');
      setManagedUsers(current => append ? [...current, ...result.users] : result.users);
      setNextUsersOffset(result.nextOffset ?? null);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : 'Impossibile caricare gli utenti.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const savedRegion = user.unsafeMetadata.region;
    setRegion(typeof savedRegion === 'string' && regions.includes(savedRegion) ? savedRegion : 'Campania');
  }, [user]);

  useEffect(() => {
    if (isAdmin) void loadUsers(0, false);
  }, [isAdmin, loadUsers]);

  const updateUserRole = async (managedUser: ManagedUser) => {
    if (userActionId) return;
    const role = managedUser.role === 'admin' ? 'user' : 'admin';
    setUserActionId(managedUser.id);
    setUsersError('');
    setUsersMessage('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: managedUser.id, role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossibile aggiornare il ruolo.');
      setManagedUsers(current => current.map(item => item.id === managedUser.id ? result.user : item));
      setUsersMessage(`Ruolo aggiornato per ${managedUser.email}.`);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : 'Impossibile aggiornare il ruolo.');
    } finally {
      setUserActionId('');
    }
  };

  const deleteUser = async (managedUser: ManagedUser) => {
    if (userActionId || !window.confirm(`Eliminare definitivamente l’account ${managedUser.email}? L’operazione non può essere annullata.`)) return;
    setUserActionId(managedUser.id);
    setUsersError('');
    setUsersMessage('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: managedUser.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossibile eliminare l’utente.');
      setManagedUsers(current => current.filter(item => item.id !== result.deletedUserId));
      setUsersMessage(`Account ${managedUser.email} eliminato.`);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : 'Impossibile eliminare l’utente.');
    } finally {
      setUserActionId('');
    }
  };

  const saveRegion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setIsSavingRegion(true);
    setRegionMessage('');
    try {
      await user.update({
        unsafeMetadata: { ...user.unsafeMetadata, region },
      });
      setRegionMessage('Regione aggiornata.');
    } catch {
      setRegionMessage('Non è stato possibile aggiornare la regione.');
    } finally {
      setIsSavingRegion(false);
    }
  };

  const logout = async () => {
    await signOut();
    window.location.assign('/');
  };

  if (!isLoaded) {
    return <main className="mx-auto w-full max-w-5xl p-6 text-sm text-slate-600">Caricamento profilo…</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-xl p-6">
        <h1 className="text-2xl font-bold text-[#0B1B3D]">Accedi per gestire il profilo</h1>
        <Link href="/sign-in" className="mt-4 inline-flex rounded-lg bg-[#0B1B3D] px-4 py-2 text-sm font-bold text-white">Accedi</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6F9] px-4 py-6 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#A60F2D]">Area riservata</p>
            <h1 className="mt-1 text-2xl font-black text-[#0B1B3D]">Profilo e sicurezza</h1>
            <p className="mt-1 break-all text-sm text-slate-600">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0B1B3D] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Torna al regolamento</Link>
            <button type="button" onClick={logout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Esci</button>
          </div>
        </header>

        <section aria-labelledby="fita-region-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 id="fita-region-title" className="text-lg font-bold text-[#0B1B3D]">Dati FITA</h2>
          <form onSubmit={saveRegion} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full max-w-sm">
              <label htmlFor="profile-region" className="mb-1 block text-sm font-semibold text-slate-700">Regione / Comitato</label>
              <select id="profile-region" value={region} onChange={event => setRegion(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800">
                {regions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <button type="submit" disabled={isSavingRegion} className="rounded-lg bg-[#0B1B3D] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
              {isSavingRegion ? 'Salvataggio…' : 'Salva regione'}
            </button>
            {regionMessage && <p role="status" className="text-sm text-slate-600">{regionMessage}</p>}
          </form>
        </section>

        {isAdmin && (
          <section aria-labelledby="user-management-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="user-management-title" className="text-lg font-bold text-[#0B1B3D]">Gestione utenti</h2>
                <p className="mt-1 text-sm text-slate-600">Visualizza gli account, assegna o rimuovi il ruolo admin ed elimina gli account non più necessari.</p>
              </div>
              <button type="button" onClick={() => { setUsersMessage(''); void loadUsers(0, false); }} disabled={usersLoading || Boolean(userActionId)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {usersLoading ? 'Aggiornamento…' : 'Aggiorna elenco'}
              </button>
            </div>
            {usersMessage && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{usersMessage}</p>}
            {usersError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{usersError}</p>}
            {usersLoading && managedUsers.length === 0 && <p className="mt-4 text-sm text-slate-600">Caricamento utenti…</p>}
            {!usersLoading && usersError && managedUsers.length === 0 && (
              <button type="button" onClick={() => void loadUsers(0, false)} className="mt-3 rounded-lg bg-[#0B1B3D] px-4 py-2 text-sm font-bold text-white">Riprova</button>
            )}
            {managedUsers.length > 0 && (
              <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
                {[...managedUsers].sort((a, b) => {
                  if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
                  return a.name.localeCompare(b.name, 'it', { sensitivity: 'base' });
                }).map(managedUser => {
                  const isCurrentUser = managedUser.id === user.id;
                  const isBusy = userActionId === managedUser.id;
                  return (
                    <li key={managedUser.id} className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${managedUser.role === 'admin' ? 'bg-amber-50/60' : ''}`}>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words font-semibold text-slate-900">{formatPersonName(managedUser.name)}</p>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${managedUser.role === 'admin' ? 'border-amber-300 bg-amber-100 text-amber-950' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                            {managedUser.role === 'admin' ? <><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Admin</> : <><UserRound className="h-3.5 w-3.5" aria-hidden="true" /> Utente</>}
                          </span>
                        </div>
                        <p className="break-all text-sm text-slate-600">{managedUser.email}</p>
                        <p className="mt-1 text-xs text-slate-500">Creato il {new Date(managedUser.createdAt).toLocaleDateString('it-IT')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => void updateUserRole(managedUser)} disabled={Boolean(userActionId) || isCurrentUser} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                          {isBusy ? 'Salvataggio…' : managedUser.role === 'admin' ? 'Rimuovi admin' : 'Rendi admin'}
                        </button>
                        <button type="button" onClick={() => void deleteUser(managedUser)} disabled={Boolean(userActionId) || isCurrentUser} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                          {isBusy ? 'Attendi…' : 'Elimina'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {!usersLoading && managedUsers.length === 0 && !usersError && <p className="mt-4 text-sm text-slate-600">Nessun utente trovato.</p>}
            {nextUsersOffset !== null && (
              <button type="button" onClick={() => void loadUsers(nextUsersOffset, true)} disabled={usersLoading || Boolean(userActionId)} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {usersLoading ? 'Caricamento…' : 'Carica altri utenti'}
              </button>
            )}
          </section>
        )}

        <section aria-labelledby="account-security-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 id="account-security-title" className="mb-4 text-lg font-bold text-[#0B1B3D]">Email, password e account</h2>
          <p className="mb-4 text-sm text-slate-600">Gestisci l’indirizzo email, verifica le modifiche e aggiorna la password. Clerk ti guiderà nei passaggi di conferma.</p>
          <UserProfile appearance={{ elements: {
            rootBox: 'w-full min-w-0 max-w-full',
            cardBox: 'w-full min-w-0 max-w-full',
            card: 'w-full min-w-0 max-w-full',
            navbar: 'min-w-0 max-w-full',
            pageScrollBox: 'w-full min-w-0 max-w-full px-2 sm:px-6',
            profileSectionContent: 'min-w-0 max-w-full [overflow-wrap:anywhere]',
            profileSectionItem: 'min-w-0 max-w-full flex-wrap',
            profileSectionPrimaryButton: 'max-w-full whitespace-normal',
          } }} />
        </section>

      </div>
    </main>
  );
}
