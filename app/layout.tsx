import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import SupabaseProvider from "@/components/SupabaseProvider";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SealedNote - Anonymous feedback, filtered and encrypted",
  description:
    "Receive anonymous feedback that is filtered for meanness and encrypted for your privacy",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider session={session}>
          {/* App shell: header + main + footer without fixed positioning */}
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-1 min-h-0">{children}</main>
            <footer className="mt-auto border-t border-gray-200 bg-white">
              <div className="max-w-4xl mx-auto px-4 py-3 text-center text-sm text-gray-600">
                🔒 Open-source & encrypted
              </div>
            </footer>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
