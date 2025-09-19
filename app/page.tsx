import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/SignInCard";
import EnvelopeHero from "@/components/EnvelopeHero";

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
    <div className="min-h-full px-2 sm:px-6 py-4 sm:py-6">
      <div className="mx-auto w-[96%] sm:w-full max-w-2xl">
        <h1 className="sr-only">Anonymous feedback without the downsides</h1>
        <div className="relative">
          <EnvelopeHero />
          <div className="absolute bottom-[4%] sm:bottom-[10%] left-1/2 -translate-x-1/2 w-[90%] sm:w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[520px] px-3 sm:px-4">
            <SignInForm />
          </div>
        </div>
      </div>
      <div className="mt-12 space-y-0.5 text-lg text-gray-700 flex flex-col items-center text-center px-2">
        <h2 className="text-xl font-semibold">Why SealedNote?</h2>
        <Feature text="Free, open source, & end-to-end encrypted" />
        <Feature text="Use your own AI with an OpenRouter API key" />
        <Feature text="Receive higher quality feedback with AI coaching" />
        <Feature text="Prevent counterproductive feedback with AI filters" />
      </div>
      <div className="mt-2 text-center">
        <Link href="/how-it-works" className="button-link">
          Learn more →
        </Link>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return <p className="flex-1 text-md leading-snug">{text}</p>;
}
