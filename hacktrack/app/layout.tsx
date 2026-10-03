import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ToasterClient } from "@/components/ToasterClient";
import { FloatingSymbols } from "@/components/FloatingSymbols";
import { WelcomeSplash } from "@/components/WelcomeSplash";
import { getCurrentUser } from "@/actions/auth";
import { WELCOME_COOKIE_NAME } from "@/lib/auth";
import { pickDevFactIndex } from "@/lib/splash-content";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeController } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "HackTrack — Neubrutalist Hackathon Command Center",
  description:
    "Manage hackathons, track participants, and schedule reliable automated email broadcasts via Gmail API.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // theme-color is rendered in <head> below so the theme script can update it before first paint
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const welcome = user ? cookieStore.get(WELCOME_COOKIE_NAME)?.value : undefined;

  return (
    // data-theme and color-scheme are set by THEME_INIT_SCRIPT before paint, so React must accept the DOM here
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={THEME_COLORS.light} suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="relative min-h-[100dvh] flex flex-col overflow-x-hidden bg-canvas text-ink selection:bg-primary-yellow selection:text-on-accent">
        <ThemeController />
        <FloatingSymbols />
        <Navbar userEmail={user?.email} userName={user?.name} />
        {/* Each route group decides its own container: (app) pages are padded, auth/landing are edge to edge.
            No z-index here on purpose: it would trap full-screen loaders (z-[100]) beneath the navbar.
            Coming after FloatingSymbols in the DOM is enough to paint above them. */}
        <div className="relative flex flex-1 flex-col">{children}</div>
        <ToasterClient />
        {welcome && <WelcomeSplash name={user?.name} isNew={welcome === "new"} factIndex={pickDevFactIndex()} />}
      </body>
    </html>
  );
}
