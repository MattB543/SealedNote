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
    const { data: profile, error } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile) {
      redirect("/auth/setup");
    }

    redirect("/dashboard");
  }

  return (
    <main className="min-h-full px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl text-center leading-relaxed">
            Get anonymous feedback
            <br />
            with no downsides
          </h1>
          <div className="mt-6 space-y-2 text-md text-gray-700 flex flex-col items-center">
            <Feature text="Open source and end-to-end encrypted" />
            <Feature text="Use your own AI with an OpenRouter API key" />
            <Feature text="Receive higher quality feedback with AI coaching" />
            <Feature text="Prevent counterproductive feedback with AI filters" />
          </div>
          <div className="mt-2 text-center">
            <Link href="/how-it-works" className="button-link">
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
  return <p className="flex-1 text-md leading-snug">{text}</p>;
}
