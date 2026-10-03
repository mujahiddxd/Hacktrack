/**
 * Copy for the post-sign-in splash. Two variants:
 * - "first": plays once, right after onboarding — introduces the app.
 * - "returning": plays on every later sign-in — short, with a rotating dev fact.
 */

export type SplashLogLine = { emoji: string; text: string };

export type SplashVariant = {
  badge: string;
  badgeClass: string;
  emoji: string;
  title: (firstName?: string) => string;
  subtitle: string;
  command: string;
  log: SplashLogLine[];
  /** Total time for the bar to reach 100% */
  durationMs: number;
};

export const FIRST_LOGIN: SplashVariant = {
  badge: "First boot",
  badgeClass: "bg-[#00E676] text-[#121212]",
  emoji: "👋",
  title: (n) => `Hey${n ? ` ${n}` : ""}, it's your first time here!`,
  subtitle: "Spinning up your hackathon command center. This only happens once ✨",
  command: "npx create-hacktrack@latest",
  log: [
    { emoji: "📁", text: "Creating your workspace" },
    { emoji: "🧠", text: "Compiling your profile" },
    { emoji: "📧", text: "Wiring up the email scheduler" },
    { emoji: "🚀", text: "Deploying your dashboard" },
  ],
  durationMs: 4200,
};

export const RETURNING_LOGIN: SplashVariant = {
  badge: "Session restored",
  badgeClass: "bg-[#2196F3] text-white",
  emoji: "👾",
  title: (n) => `Welcome back${n ? `, ${n}` : ""}!`,
  subtitle: "Pulling the latest from your hackathons…",
  command: "git pull origin main",
  log: [
    { emoji: "🔐", text: "Session verified" },
    { emoji: "📦", text: "Fetching your hackathons" },
    { emoji: "⚡", text: "Warming up the dashboard" },
  ],
  durationMs: 2600,
};

/** What a brand-new user can do first — shown only on the first-login splash. */
export const FIRST_LOGIN_TIPS: SplashLogLine[] = [
  { emoji: "🗓️", text: "Add a hackathon, or paste a link into AI Add 🤖" },
  { emoji: "👥", text: "Import participants and keep teams in one place" },
  { emoji: "⏰", text: "Connect Gmail and schedule broadcasts ahead of time" },
];

/** Rotating facts for returning users. */
export const DEV_FACTS: SplashLogLine[] = [
  { emoji: "🐛", text: "The first computer “bug” was a real moth, found in the Harvard Mark II in 1947." },
  { emoji: "☕", text: "Java was almost called Oak, after a tree outside James Gosling's office." },
  { emoji: "🐍", text: "Python is named after Monty Python, not the snake." },
  { emoji: "🌕", text: "The Apollo 11 guidance computer ran on about 4 KB of RAM." },
  { emoji: "🦆", text: "Stuck? Explain your code to a rubber duck. It works more often than it should." },
  { emoji: "🏁", text: "One of the first events called a “hackathon” was an OpenBSD meetup in Calgary, 1999." },
  { emoji: "🔢", text: "There are 10 kinds of people: those who understand binary and those who don't." },
  { emoji: "🌐", text: "The first website, info.cern.ch, is still online." },
  { emoji: "💾", text: "The save icon is a floppy disk. Many developers have never used one." },
  { emoji: "😴", text: "Weeks of coding can save you hours of planning." },
];

/** Picked on the server so the server and client render the same fact. */
export function pickDevFactIndex() {
  return Math.floor(Math.random() * DEV_FACTS.length);
}
