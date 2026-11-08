import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-4">
      <SignUp />
    </main>
  );
}
