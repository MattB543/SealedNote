import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/SignInCard";

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/auth/unlock");
  }

  return (
    <main className="min-h-full px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl text-center">
            Anonymous feedback with no downsides
          </h1>
          <div className="mt-6 space-y-2 text-sm text-gray-700">
            <Feature text="Open source and end-to-end encrypted. We can't read your feedback" />
            <Feature text="Bring your own AI with an OpenRouter API key" />
            <Feature text="Prevent counterproductive hurtful feedback with AI filtering" />
            <Feature text="Improve feedback quality and protect submitter anonymity with AI" />
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/how-it-works"
              className="text-blue-600 hover:underline"
            >
              Learn more →
            </Link>
          </div>
          <div className="mt-8">
            <SignInForm />
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 text-blue-600">-</span>
      <p className="flex-1 text-sm leading-snug">{text}</p>
    </div>
  );
}
