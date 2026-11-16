'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { getAccountRegion, REGIONS } from '../lib/account-preferences';

export const authAppearance = {
  elements: {
    rootBox: 'w-full min-w-0 max-w-full',
    cardBox: 'w-full min-w-0 max-w-full',
    card: 'w-full min-w-0 max-w-full px-3 sm:px-8',
    footer: 'max-w-full [overflow-wrap:anywhere]',
  },
};

export function RegistrationForm({ embedded = false }: { embedded?: boolean }) {
  const [preferences, setPreferences] = useState<{ region: string; notificationsEnabled: boolean } | null>(null);

  if (!preferences) {
    return (
      <form
        className="mx-auto w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm"
        onSubmit={event => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const region = getAccountRegion(data.get('region'));
          const notifications = data.get('notifications');
          if (!region || (notifications !== 'yes' && notifications !== 'no')) return;
          setPreferences({ region, notificationsEnabled: notifications === 'yes' });
        }}
      >
        <h2 className="text-xl font-bold text-[#0B1B3D]">Crea un account</h2>
        <label className="block text-sm font-semibold text-slate-800">
          Regione di appartenenza
          <select required name="region" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm">
            <option value="" disabled>Seleziona la tua regione</option>
            {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
          </select>
        </label>
        <fieldset className="space-y-1">
          <legend className="text-sm font-semibold text-slate-800">Vuoi ricevere le notifiche del portale?</legend>
          <p className="text-xs text-slate-600">Puoi cambiare scelta dal profilo. Per gli avvisi sul dispositivo serve anche il permesso del browser.</p>
          <div className="flex gap-2">
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"><input type="radio" name="notifications" value="yes" required /> Sì</label>
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"><input type="radio" name="notifications" value="no" required /> No</label>
          </div>
        </fieldset>
        <button type="submit" className="min-h-11 w-full rounded-lg bg-[#0B1B3D] px-4 text-sm font-bold text-white">Continua</button>
        <p className="text-center text-xs text-slate-600">Hai già un account? <Link className="font-semibold text-blue-700 underline" href="/sign-in">Accedi</Link></p>
      </form>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-sm space-y-3">
      <SignUp
        appearance={authAppearance}
        signInUrl="/sign-in"
        unsafeMetadata={preferences}
        {...(embedded ? { routing: 'hash' as const } : {})}
      />
    </div>
  );
}
