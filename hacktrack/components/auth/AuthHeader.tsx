import Link from "next/link";
import { CalendarCheck, Mail, Sparkles, Users } from "lucide-react";

const FEATURES = [
  { icon: CalendarCheck, title: "Every event in one place", text: "Dates, rounds, fees and deadlines — with clash detection." },
  { icon: Users, title: "Participants, organised", text: "Keep each hackathon's builders and their emails tidy." },
  { icon: Mail, title: "Scheduled broadcasts", text: "Write once, deliver from your Gmail at the right moment." },
  { icon: Sparkles, title: "AI import", text: "Paste an announcement, get a ready-to-save hackathon." },
];

export function AuthHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="mb-8 text-center lg:text-left">
      <Link
        href="/"
        aria-label="HackTrack home"
        className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border-3 border-ink bg-[#FFEB3B] text-on-accent text-xl font-black shadow-brutal lg:hidden"
      >
        HT
      </Link>
      <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">
        <span className="lg:hidden">HACKTRACK</span>
        <span className="hidden lg:inline">{subtitle}</span>
      </h1>
      <p className="mt-1 text-sm font-bold text-muted lg:hidden">{subtitle}</p>
    </div>
  );
}

/** Full-screen auth layout: brand story fills the left half on desktop, form centred on the right. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] w-full lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#121212] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-4 select-none font-mono text-[10rem] font-black leading-none text-white/[0.04]">
          {"{}"}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-28 right-12 select-none font-mono text-7xl font-black text-white/[0.04]">
          ∑
        </div>

        <Link href="/" className="relative flex w-fit items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-3 border-white bg-[#FFEB3B] text-lg font-black text-on-accent">
            HT
          </div>
          <span className="text-2xl font-black tracking-tight">HACKTRACK</span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-4xl font-black leading-tight xl:text-5xl">
            Your hackathon command center<span className="text-[#FFEB3B]">.</span>
          </p>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-white/80 bg-white/10">
                  <Icon className="h-5 w-5 text-[#FFEB3B]" />
                </div>
                <div>
                  <p className="text-base font-black">{title}</p>
                  <p className="text-sm font-medium leading-relaxed text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs font-bold text-white/50">{"> build. ship. win._"}</p>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
