import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-4">
      <SignIn />
    </main>
  );
}
