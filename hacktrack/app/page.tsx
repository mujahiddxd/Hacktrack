import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarCheck, Mail, Sparkles, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: CalendarCheck,
    tone: "bg-[#FFEB3B] text-on-accent",
    title: "Every event, one place",
    text: "Dates, rounds, fees and deadlines — with automatic clash detection when two events land on the same day.",
  },
  {
    icon: Mail,
    tone: "bg-[#00E676] text-on-accent",
    title: "Scheduled broadcasts",
    text: "Write an update once and HackTrack emails every participant at exactly the time you choose.",
  },
  {
    icon: Sparkles,
    tone: "bg-[#2196F3] text-white",
    title: "AI import",
    text: "Paste an announcement or brochure and get a ready-to-save hackathon in seconds.",
  },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border-3 border-ink bg-[#FFEB3B] text-on-accent font-black shadow-brutal-sm">
        HT
      </span>
      <span className="text-xl font-black tracking-tight">HACKTRACK</span>
    </Link>
  );
}

/** Static mock of the dashboard so visitors see the product, not a stock illustration. */
function ProductPreview() {
  const rows = [
    { name: "CodeStorm 2026", date: "OCT 15", people: 48, tone: "bg-[#2196F3] text-white" },
    { name: "AI Genesis", date: "NOV 20", people: 32, tone: "bg-[#00E676] text-on-accent" },
    { name: "Hack the Planet", date: "DEC 04", people: 21, tone: "bg-[#2196F3] text-white" },
  ];
  return (
    <div aria-hidden="true" className="w-full max-w-md rounded-2xl border-3 border-ink bg-surface p-5 shadow-brutal-lg">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5252] text-on-accent" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FFEB3B] text-on-accent" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#00E676] text-on-accent" />
        <span className="ml-3 font-mono text-xs font-bold text-muted">hacktrack / dashboard</span>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          ["3", "Upcoming"],
          ["101", "Participants"],
          ["7", "Scheduled"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border-2 border-ink p-2.5">
            <p className="text-xl font-black leading-none">{value}</p>
            <p className="mt-1 text-[11px] font-bold text-muted">{label}</p>
          </div>
        ))}
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3 rounded-lg border-2 border-ink p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{r.name}</p>
              <p className="flex items-center gap-1 text-xs font-bold text-muted">
                <Users className="h-3 w-3" />
                {r.people} participants
              </p>
            </div>
            <span className={`shrink-0 rounded-md border-2 border-ink px-2 py-0.5 font-mono text-[11px] font-bold ${r.tone}`}>
              {r.date}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect(session.needsOnboarding ? "/onboarding" : "/home");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="px-2 text-sm font-bold text-ink hover:underline sm:px-3">
            Log in
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm", className: "font-black sm:px-4 sm:py-2 sm:text-sm" })}>
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-24 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-surface px-3 py-1 font-mono text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-[#00E676] text-on-accent" />
              For hackathon organisers &amp; builders
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Run every hackathon from one command center<span className="text-[#FFEB3B] [text-shadow:2px_2px_0_#121212]">.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-body">
              Track events and deadlines, keep participants organised, and schedule emails that go out on time — without
              spreadsheets.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={buttonVariants({ size: "lg", className: "font-black" })}>
                Get started free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                I have an account
              </Link>
            </div>
            <p className="mt-4 text-sm font-medium text-muted">Sign up with Google or email in under a minute.</p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ProductPreview />
          </div>
        </section>

        {/* Features */}
        <section className="border-y-3 border-ink bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8 lg:py-20">
            {FEATURES.map(({ icon: Icon, tone, title, text }) => (
              <article key={title} className="rounded-2xl border-2 border-ink bg-canvas p-6 shadow-brutal-sm">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black">{title}</h2>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-body">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border-3 border-ink bg-[#121212] p-8 text-white shadow-brutal-lg sm:p-10 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Your next hackathon, organised.</h2>
              <p className="mt-2 text-base font-medium text-white/70">Free to start. Set up in a minute.</p>
            </div>
            <Link
              href="/register"
              className={buttonVariants({ size: "lg", className: "w-full shrink-0 border-white font-black shadow-[4px_4px_0_#fff] sm:w-auto" })}
            >
              Create your account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm font-medium text-muted sm:flex-row sm:px-6 lg:px-8">
          <span className="font-black text-ink">HACKTRACK</span>
          <span>© {new Date().getFullYear()} HackTrack</span>
        </div>
      </footer>
    </div>
  );
}
