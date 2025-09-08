import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import SupabaseProvider from "@/components/SupabaseProvider";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FilteredFeedback - Anonymous feedback, filtered and encrypted",
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
          <div className="min-h-[calc(100vh-64px)] bg-gray-50 pb-20">
            <Header />
            {children}
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
              <div className="container mx-auto text-center text-sm text-gray-600">
                🔒 End-to-end encryption with your public key
              </div>
            </footer>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
