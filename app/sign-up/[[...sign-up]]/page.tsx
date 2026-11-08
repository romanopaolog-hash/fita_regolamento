import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-4">
      <Suspense fallback={<p className="text-sm text-slate-600">Caricamento registrazione…</p>}>
        <SignUp />
      </Suspense>
    </main>
  );
}
