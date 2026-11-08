import { Suspense } from 'react';
import ProfileCenter from '../profile-center';

export default function ProfilePage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-5xl p-6 text-sm text-slate-600">Caricamento area profilo…</main>}>
      <ProfileCenter />
    </Suspense>
  );
}
