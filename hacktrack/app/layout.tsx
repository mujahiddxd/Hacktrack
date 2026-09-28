import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ToasterClient } from "@/components/ToasterClient";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "HackTrack — Neubrutalist Hackathon Command Center",
  description:
    "Manage hackathons, track participants, and schedule reliable automated email broadcasts via Gmail API.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className="min-h-[100dvh] flex flex-col bg-[#FEFDF8] text-[#121212] selection:bg-[#FFEB3B] selection:text-[#121212]">
        <Navbar adminEmail={session?.email} />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
        <ToasterClient />
      </body>
    </html>
  );
}
