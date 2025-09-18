import type { Metadata } from "next";
import { Inter, Merienda, Crimson_Text } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";
import SupabaseProvider from "@/components/SupabaseProvider";
import Header from "@/components/Header";
import Script from "next/script";

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
    "Receive anonymous feedback that is filtered by AI and encrypted for your privacy",
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

  // Get nonce from headers set by middleware
  const nonce = headers().get("x-nonce") || "";

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${meri.variable} ${crimson.variable}`}
      >
        {/* Pass nonce to Next.js Script components */}
        <Script id="nonce-provider" strategy="afterInteractive" nonce={nonce} />
        <SupabaseProvider session={session}>
          {/* App shell: header + main + footer without fixed positioning */}
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 min-h-0 mt-8">{children}</main>
            <footer className="mt-auto">
              <div className="max-w-4xl mx-auto px-4 py-3 text-center text-sm text-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:gap-2">
                  <div>🔒 Open-source & encrypted</div>
                  <div className="hidden sm:inline">|</div>
                  <div>Terms of Service | Privacy Policy</div>
                </div>
              </div>
            </footer>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
