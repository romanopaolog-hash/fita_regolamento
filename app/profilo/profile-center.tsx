'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { UserProfile, useClerk, useUser } from '@clerk/nextjs';

const regions = [
  'Campania', 'Lazio', 'Lombardia', 'Piemonte', 'Sicilia',
  'Veneto', 'Emilia-Romagna', 'Puglia', 'Toscana',
];

export default function ProfileCenter() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [region, setRegion] = useState('Campania');
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [regionMessage, setRegionMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    const savedRegion = user.unsafeMetadata.region;
    setRegion(typeof savedRegion === 'string' && regions.includes(savedRegion) ? savedRegion : 'Campania');
  }, [user]);

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
            <p className="mt-1 text-sm text-slate-600">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Torna al regolamento</Link>
            <button type="button" onClick={logout} className="rounded-lg bg-[#0B1B3D] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Esci</button>
          </div>
        </header>

        <section aria-labelledby="account-security-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 id="account-security-title" className="mb-4 text-lg font-bold text-[#0B1B3D]">Email, password e account</h2>
          <p className="mb-4 text-sm text-slate-600">Gestisci l’indirizzo email, verifica le modifiche e aggiorna la password. Clerk ti guiderà nei passaggi di conferma.</p>
          <UserProfile />
        </section>

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
      </div>
    </main>
  );
}
