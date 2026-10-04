import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck,
  CalendarX2,
  ClipboardPaste,
  History,
  Lock,
  Mail,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import { getDashboardMetrics } from "@/actions/hackathons";
import { getConnectedGmailAccount } from "@/lib/gmail";
import { buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-header";
import { HowItWorksMotion } from "@/components/home/HowItWorksMotion";
import { StreakDeck } from "@/components/streaks/StreakDeck";
import { SetupCard, type SetupStep } from "@/components/home/SetupCard";

export const dynamic = "force-dynamic";

/** Everything here describes what the app actually does today; keep it that way when features change. */
const PROS = [
  {
    icon: CalendarCheck,
    tone: "bg-[#FFEB3B] text-on-accent",
    title: "Every event in one place",
    text: "Dates, registration deadlines, rounds, fees, location and links live together instead of across tabs and chats.",
  },
  {
    icon: CalendarX2,
    tone: "bg-[#FF5252] text-white",
    title: "Clash warnings",
    text: "Pick a date that's already taken and HackTrack tells you which event it clashes with before you save.",
  },
  {
    icon: ClipboardPaste,
    tone: "bg-[#2196F3] text-white",
    title: "Less typing with AI Add",
    text: "Paste an announcement or brochure text and the form is filled in for you. You check it, then save.",
  },
  {
    icon: Send,
    tone: "bg-[#00E676] text-on-accent",
    title: "Emails on schedule",
    text: "Messages are queued for the time you choose, sent from your own Gmail, and every recipient gets a Sent or Failed status.",
  },
  {
    icon: History,
    tone: "bg-surface",
    title: "Nothing gets lost",
    text: "Flagged and removed hackathons stay in History, so you can look back or restore one later.",
  },
  {
    icon: Lock,
    tone: "bg-[#121212] text-white",
    title: "Your data stays yours",
    text: "Hackathons, participants and messages are tied to your account. Other users can't see them.",
  },
];

const delay = (s: number) => ({ "--ht-delay": `${s}s` }) as CSSProperties;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ metrics }, gmail] = await Promise.all([getDashboardMetrics(), getConnectedGmailAccount(user.id)]);
  const firstName = user.name?.trim().split(/\s+/)[0];
  const emailReady = !!gmail?.connected && !gmail.isDemo;
  const messagesTotal = metrics.scheduledMessagesCount + metrics.sentMessagesCount;

  const setup: SetupStep[] = [
    {
      id: "hackathon",
      done: metrics.totalHackathons > 0,
      title: "Add your first hackathon",
      detail:
        metrics.totalHackathons > 0
          ? `${metrics.totalHackathons} hackathon${metrics.totalHackathons === 1 ? "" : "s"} added`
          : "Fill in the form, or paste an announcement into AI Add",
      href: metrics.totalHackathons > 0 ? "/hackathons" : "/hackathons/new",
    },
    {
      id: "participants",
      done: metrics.totalParticipants > 0,
      title: "Add participants",
      detail:
        metrics.totalParticipants > 0
          ? `${metrics.totalParticipants} participant${metrics.totalParticipants === 1 ? "" : "s"} across your events`
          : "Open a hackathon and add people with their email",
      href: "/hackathons",
    },
    {
      id: "gmail",
      done: emailReady,
      title: "Connect Gmail",
      detail: emailReady ? `Sending as ${gmail?.email}` : "Needed so scheduled emails can be sent for you",
      href: "/settings",
    },
    {
      id: "email",
      done: messagesTotal > 0,
      title: "Schedule your first email",
      detail:
        messagesTotal > 0
          ? `${metrics.scheduledMessagesCount} waiting · ${metrics.sentMessagesCount} sent`
          : "Pick a hackathon, write the message and choose a send time",
      href: "/hackathons",
    },
  ];

  return (
    <PageShell className="space-y-14 sm:space-y-20">
      {/* ── Hero + real setup progress ── */}
      <section className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div className="min-w-0 lg:pt-6">
          <p
            style={delay(0)}
            className="ht-rise inline-flex items-center gap-2 rounded-full border-2 border-ink bg-surface px-3 py-1 font-mono text-xs font-bold"
          >
            <span className="h-2 w-2 rounded-full bg-[#00E676] text-on-accent" />
            Home
          </p>
          <h1
            style={delay(0.08)}
            className="ht-rise mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl"
          >
            {firstName ? `Hi ${firstName}, ` : "Hi, "}
            welcome to your command center<span className="text-[#FFEB3B] [text-shadow:2px_2px_0_#121212]">.</span>
          </h1>
          <p
            style={delay(0.16)}
            className="ht-rise mt-5 max-w-xl text-base font-medium leading-relaxed text-body sm:text-lg"
          >
            HackTrack keeps your hackathons, their participants and the emails you send them in one place, so nothing
            slips between spreadsheets and inboxes.
          </p>
          <div style={delay(0.24)} className="ht-rise mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "font-black" })}>
              Open dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/ai-add" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <Sparkles className="h-5 w-5" />
              Try AI Add
            </Link>
          </div>
        </div>

        <SetupCard steps={setup} userId={user.id} style={delay(0.3)} />
      </section>

      {/* ── How it works (motion) ── */}
      {/* The heading (#how-heading) and Replay control live inside the walkthrough component */}
      <section aria-labelledby="how-heading">
        <HowItWorksMotion />
      </section>

      {/* ── Pros ── */}
      <section className="ht-reveal" aria-labelledby="why-heading">
        <div className="mb-6 max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted">Why HackTrack</p>
          <h2 id="why-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            Built for the busy parts of running a hackathon
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROS.map(({ icon: Icon, tone, title, text }) => (
            <article
              key={title}
              className="ht-reveal rounded-xl border-3 border-ink bg-surface p-5 shadow-brutal transition-transform hover:-translate-y-1"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-black">{title}</h3>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-body">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="ht-reveal">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border-3 border-ink bg-[#121212] p-6 text-white shadow-brutal-lg sm:p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">Ready when you are.</h2>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-white/70 sm:text-base">
              <Users className="h-4 w-4" /> Add an event, invite your builders, <Mail className="h-4 w-4" /> schedule the update.
            </p>
          </div>
          <Link
            href="/hackathons/new"
            className={buttonVariants({
              size: "lg",
              className: "w-full shrink-0 border-white font-black shadow-[4px_4px_0_#fff] sm:w-auto",
            })}
          >
            Add a hackathon
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── Developer Streak Deck ── */}
      <section aria-labelledby="streaks-heading">
        <div className="mb-5 max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted">Consistency</p>
          <h2 id="streaks-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            Your developer streaks
          </h2>
          <p className="mt-1.5 text-sm font-medium text-body sm:text-base">
            Pick a platform to bring its card to the front. Streaks only count days a source can prove.
          </p>
        </div>
        <StreakDeck size="large" />
      </section>
    </PageShell>
  );
}
