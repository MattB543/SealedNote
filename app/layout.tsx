import type { Metadata } from "next";
import { Inter, Merienda, Crimson_Text } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import SupabaseProvider from "@/components/SupabaseProvider";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const meri = Merienda({
  weight: "600",
  subsets: ["latin"],
  variable: "--font-merienda",
});
const crimson = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

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
      <body
        className={`${inter.variable} ${meri.variable} ${crimson.variable}`}
      >
        <SupabaseProvider session={session}>
          {/* App shell: header + main + footer without fixed positioning */}
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 min-h-0 mt-8">{children}</main>
            <footer className="mt-auto">
              <div className="max-w-4xl mx-auto px-4 py-3 text-center text-sm text-gray-700">
                🔒 Open-source & encrypted | Terms of Service | Privacy Policy
              </div>
            </footer>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
