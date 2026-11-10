'use client';

import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "../../registration-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-4">
      <Suspense fallback={<p className="text-sm text-slate-600">Caricamento accesso…</p>}>
        <div className="w-full min-w-0 max-w-sm"><SignIn appearance={authAppearance} signUpUrl="/sign-up" /></div>
      </Suspense>
    </main>
  );
}
