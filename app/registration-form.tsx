'use client';

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
  return (
    <div className="mx-auto w-full min-w-0 max-w-sm space-y-3">
      <SignUp
        appearance={authAppearance}
        signInUrl="/sign-in"
        {...(embedded ? { routing: 'hash' as const } : {})}
      />
    </div>
  );
}
