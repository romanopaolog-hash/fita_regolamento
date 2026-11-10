'use client';

import { useState } from 'react';
import { SignUp } from '@clerk/nextjs';

export const authAppearance = {
  elements: {
    rootBox: 'w-full min-w-0 max-w-full',
    cardBox: 'w-full min-w-0 max-w-full',
    card: 'w-full min-w-0 max-w-full px-3 sm:px-8',
    footer: 'max-w-full [overflow-wrap:anywhere]',
  },
};

export function RegistrationForm({ embedded = false }: { embedded?: boolean }) {
  const [newsNotifications, setNewsNotifications] = useState(false);

  return (
    <div className="mx-auto w-full min-w-0 max-w-sm space-y-3">
      <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <input type="checkbox" checked={newsNotifications} onChange={event => setNewsNotifications(event.target.checked)} className="mt-1 shrink-0 accent-blue-800" />
        <span>Voglio ricevere nel portale le notifiche sulle nuove news.</span>
      </label>
      <SignUp
        appearance={authAppearance}
        signInUrl="/sign-in"
        unsafeMetadata={{ newsNotifications }}
        {...(embedded ? { routing: 'hash' as const } : {})}
      />
    </div>
  );
}
