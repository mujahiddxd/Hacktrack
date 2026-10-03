# HackTrack Design System

HackTrack is a **Neubrutalist hackathon command center**: a warm off-white canvas, thick ink borders, hard offset shadows, flat saturated accents, and a developer's sense of humor (code glyphs, terminal motifs, emojis). This file describes the rules every screen follows. If you are adding UI, match these rules instead of inventing new ones.

> Source of truth: tokens live in [`app/globals.css`](app/globals.css); primitives live in [`components/ui/`](components/ui).

---

## 1. Principles

1. **Ink first.** Every surface has a visible edge. Thick `#121212` borders and hard shadows create the hierarchy, not gradients or blur.
2. **Tactile, not glossy.** Interactive things behave like physical keys: they lift on hover and press *into* their shadow when clicked.
3. **Flat colour with a job.** Each accent means something specific (see §2). Don't use colour for decoration only.
4. **Built by developers, for developers.** Monospace labels, terminal cards, `</>` glyphs and dev emojis are part of the voice. Use them as seasoning; never let them get in the way of content.
5. **Calm under the noise.** Decorative layers stay at low opacity, sit behind content, ignore pointer events, and respect `prefers-reduced-motion`.

---

## 2. Colour & theme

HackTrack has **Light**, **Dark** and **System** themes. Colours are semantic CSS variables (`--ht-*` in `app/globals.css`) exposed as Tailwind utilities. **Use the utilities, never raw hex, for neutrals.**

| Utility | Light | Dark | Role |
|---|---|---|---|
| `bg-canvas` | `#FEFDF8` | `#141418` | Page background |
| `bg-surface` | `#FFFFFF` | `#1E1E24` | Cards, inputs, menus, dialogs, toasts |
| `bg-quiet` | `#F4F4F5` | `#2A2A31` | Quiet fills, hovers, inactive |
| `bg-subtle` / `divide-subtle` | `#E4E4E7` | `#3A3A43` | Soft dividers, empty tracks |
| `text-ink` / `border-ink` / `bg-ink` | `#121212` | `#F2EFE6` | Primary text, brutal borders, ink bars |
| `text-body` | `#52525B` | `#C9C6BE` | Secondary paragraphs |
| `text-muted` | `#71717A` | `#A3A0A8` | Captions, helper text |
| `text-faint` | `#A1A1AA` | `#75737B` | Decorative icons only, never text |
| `shadow-brutal*` | `#121212` | `#CFCABD` | Hard offset shadows (`--ht-shadow`) |
| `text-on-accent` | `#121212` | `#121212` | Text/icons on yellow or mint (fixed) |
| `bg-tint-coral/blue/mint/yellow` | pale | deep | Error/info/success panels |
| focus ring | `#2196F3` | `#64B5F6` | `--ht-focus` |

Accents are **fixed** in both themes so their meaning never changes: yellow `#FFEB3B` (brand, primary, active), mint `#00E676` (success, create), blue `#2196F3` (info, scheduled, AI), coral `#FF5252` (errors, destructive). Button hover shades: yellow `#FDD835`, coral `#FF1744`, blue `#1E88E5`, mint `#00C853`.

Rules:
- **Solid yellow or mint fill → add `text-on-accent`** (and don't hard-set `text-ink` on children, which would turn cream in dark mode). Text on blue/coral is white.
- Translucent tints (`bg-[#FFEB3B]/15`) keep normal `text-ink`.
- **Always-dark brand surfaces** (auth/onboarding side panels, the splash terminal, closing CTA blocks, table headers, the `dark` button/badge) stay `#121212` in both themes, with `border-ink` for separation.
- SVG illustrations use `var(--ht-*)` in `fill`/`stroke` (shadow shapes `--ht-shadow`, panels `--ht-surface`); marks on accents stay fixed.
- How it's applied: an inline script in `<head>` (`THEME_INIT_SCRIPT`, `lib/theme.ts`) sets `<html data-theme>`, `color-scheme` and the `theme-color` meta before first paint. The choice is saved in `localStorage["hacktrack-theme"]` (absent = System). The switcher is `components/ThemeToggle.tsx` (navbar, desktop + mobile menu).

---

## 3. Typography

- **Sans:** system stack (`-apple-system, Segoe UI, Roboto, Helvetica, Arial`).
- **Mono:** Tailwind `font-mono`, used for eyebrows, badges, terminal text, counters and code glyphs.

| Use | Classes |
|-----|---------|
| Page title (H1) | `text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight` |
| Section title (H2) | `text-lg sm:text-xl font-black tracking-tight` |
| Card title (H3) | `font-black text-xl tracking-tight` |
| Eyebrow | `font-mono text-xs font-bold uppercase tracking-wider text-[#71717A]` |
| Form label | `text-xs font-bold uppercase tracking-wider` |
| Body | `text-sm sm:text-base font-medium leading-relaxed text-[#52525B]` |
| Helper / caption | `text-xs font-medium text-[#71717A]` |
| Numbers that change | add `tabular-nums` |

Headings are always `font-black`. Avoid weights below `font-medium`.

---

## 4. Borders, radius, shadow

| Element | Border | Radius | Shadow |
|---------|--------|--------|--------|
| Card, button, modal | `3px` ink (`border-3` / `.brutal-border`) | `rounded-xl` (cards), `rounded-lg` (buttons) | `shadow-brutal` (4px) |
| Input, badge, chip | `2–3px` ink | `rounded-md` / `rounded-lg` | `shadow-brutal-sm` (2px) |
| Elevated modal / hero tile | `3px` ink | `rounded-2xl` | `shadow-brutal-lg` (6px) |
| Dividers | `border-b-2` / `border-b-3` ink | – | – |

Shadows are **always hard** (`Npx Npx 0 #121212`), never blurred, and always offset bottom-right.

---

## 5. Interaction states

| State | Behaviour |
|-------|-----------|
| Button hover | `translate(-1px,-1px)`, shadow grows to 5px |
| Button active | `translate(2px,2px)`, shadow shrinks to 1px (it "presses in") |
| Disabled | `opacity: .55`, no transform, 2px shadow, `cursor: not-allowed` |
| Input focus | `box-shadow: 3px 3px 0 #121212`, no outline |
| Input error | coral border, `bg-red-50`, coral focus shadow, bold coral message |
| Card hover (linked cards) | `hover:-translate-y-1` |
| Keyboard focus | global `:focus-visible` → `3px solid #2196F3`, `2px` offset |

---

## 6. Components (`components/ui`)

- **Button** (`button.tsx`): variants `primary` (yellow), `secondary` (coral), `blue`, `mint`, `outline`, `dark`, `ghost`; sizes `sm | md | lg`. Use `buttonVariants()` to style a `<Link>`; never nest a `<button>` inside an `<a>`.
- **Card** (`card.tsx`): `.brutal-card rounded-xl p-5 md:p-6`. `CardHeader` and `CardFooter` use 2px ink dividers.
- **Badge** (`badge.tsx`): mono, uppercase, `11px`. Variants `yellow | coral | blue | mint | neutral | outline`. `StatusBadge` maps message states: Scheduled → blue, Sending → yellow (pulsing), Sent → mint, Failed → coral.
- **Input / Textarea / Select** (`input.tsx`, `textarea.tsx`, `select.tsx`): `.brutal-input`, uppercase label above, helper or error text below.
- **ChipSelect** (`chip-select.tsx`): toggle chips that submit as one comma-joined hidden input; `aria-pressed` per chip.
- **PageShell / PageHeader / SectionHeader** (`page-header.tsx`): one width rule (`narrow` 3xl, `default` 5xl, `wide` 7xl), back link → eyebrow → title → description, actions right-aligned on `md+`.
- **Toasts** (`ToasterClient.tsx`): Sonner, top-right, white with 3px ink border and 4px shadow.

---

## 7. Layout

- Root (`app/layout.tsx`): `FloatingSymbols` (z-0) → sticky `Navbar` (z-50) → content (`relative`, no z-index) → toasts → `WelcomeSplash` (z-100).
- Z-index scale: decor `0` · in-page menus `≤ 40` · navbar & dialogs `50` · full-screen loaders `100`.
- App pages (`app/(app)/layout.tsx`): `max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10`.
- Auth, onboarding and landing pages run edge to edge and own their layout.
- Mobile first. Everything must work at ~360px with no horizontal scroll; decorative extras hide below `md`.
- Use `dvh` units (`min-h-[100dvh]`) for full-height screens.

---

## 8. Motion

All keyframes live in `globals.css` and use the `ht-` prefix.

| Class | Use |
|-------|-----|
| `.ht-floater` | Slow drift of background glyphs (20–30s loops, driven by CSS variables) |
| `.ht-press` | Brand tile pressing into its shadow (1.6s) |
| `.ht-fill` / `.ht-progress` | Determinate / indeterminate progress bars |
| `.ht-step-in` | New status line fades up 6px |
| `.ht-fade-out` | Overlay exit (350ms) |
| `.ht-caret` | Blinking yellow `▋` terminal cursor |
| `.ht-dots` | Animated "Loading..." ellipsis |

| `.ht-rise` | Entrance fade-up; stagger with `--ht-delay` |
| `.ht-reveal` | Fade-up as a section scrolls into view (CSS scroll timeline; browsers without support just show it) |
| `.ht-wt` / `wt-*` | The Home "How HackTrack works" walkthrough (see below) |

Rules: use ease-in-out or `steps()` timing (nothing bouncy), keep UI transitions at or under 300ms, animate only `transform` and `opacity`, and add every new animation to the `prefers-reduced-motion` block.

**"How HackTrack works" walkthrough** (`components/home/HowItWorksMotion.tsx`): a one-shot, ~8.6s story across four cards, drawn as custom SVG (no emoji, no animation library). One timeline (`T` in the component) sets every element's absolute delay. The controller only flips `data-play` on `.ht-wt`, which pauses or resumes every element together. It starts when the section is meaningfully in view, pauses when it leaves view or the tab is hidden, and keeps each card's finished frame afterwards. A **Replay** button remounts the scene. It plays on **every** visit to Home, including when the device asks for reduced motion (a deliberate product decision; it is the page's main explainer), and it waits while the sign-in splash covers the page (`lib/splash-signal.ts`, `<html data-splash="on">`). Colours: blue = AI / current step, green = success, amber = date clash. Cards lift 3px on hover (`@media (hover: hover)`) without touching the sequence. On mobile the rail becomes a vertical connector beside stacked cards.

---

## 9. Home (`/home`)

Where users land after every sign-in (after the welcome splash). Order: hero (greeting, one-line pitch, Dashboard + AI Add CTAs) and **Your setup** card → **How HackTrack works** loop → **Why HackTrack** pros grid → dark closing CTA.

- **No fake data.** The setup checklist reads the user's real counts (hackathons, participants, scheduled/sent emails) and Gmail connection. Pros describe features that exist in the code. If a feature changes, update the copy.
- The public marketing page stays at `/` for signed-out visitors.

---

## 10. Loading states

| Situation | Component | Look |
|-----------|-----------|------|
| Route segment loading | `app/(app)/loading.tsx` | Full screen: pressing **HT** tile and an indeterminate blue bar |
| Dashboard loading, form submit, auth transitions | `BrandLoader overlay` | Full screen: HT tile, title, stepped status line, filling bar |
| **First sign-in** (after onboarding) | `WelcomeSplash` with `isNew` | 👋 "Hey {name}, it's your first time here!", a terminal running `npx create-hacktrack@latest`, 4 setup steps, a 20-segment bar, and a "Here's what you can do" card. Runs about 4.2s. |
| **Every later sign-in** | `WelcomeSplash` | 👾 "Welcome back, {name}!", a terminal running `git pull origin main`, 3 steps, a 20-segment bar, and a random "Dev fact" card. Runs about 2.6s. |

**Rule: loading screens are full screen.** Every loader is `fixed inset-0 z-[100]` on the canvas colour, so nothing else (navbar, page, floating glyphs) shows while it's up. This only works because the root layout's content wrapper has **no z-index**. Adding one (e.g. `z-10`) creates a stacking context and traps the loaders under the `z-50` navbar again. Menus and popovers inside pages stay at `z-40` or below so they slide under the sticky navbar.

How the sign-in splash works:
- `markFreshSignIn("new" | "returning")` in `lib/auth.ts` sets the short-lived `hacktrack_welcome` cookie. `"new"` is set when onboarding completes; `"returning"` is set on password and Google sign-in.
- The root layout renders the splash on first paint when that cookie is present, and the client clears the cookie straight away. The dashboard loads underneath.
- The segmented bar (mint fill, with a yellow leading segment) eases quickly, crawls through the middle, holds on 100%, then fades out. Enter, Escape or "Skip" dismisses it.
- Copy lives in `lib/splash-content.ts`. Edit it there, not in the component. The dev fact is picked on the server so server and client markup match.

---

## 11. Voice & dev flavour

- Friendly, short and direct: "Welcome back, Shaban!" rather than "Authentication successful."
- Use developer metaphors where they add clarity: `git pull`, `deploy`, `compile`, terminal prompts.
- **Emoji palette:** 💻 ⌨️ 🖥️ 🚀 🐛 ☕ 🤖 🧠 💾 🔧 📦 ⚡ 🔐 👾 🎉. Use one emoji per line at most, and mark decorative emojis `aria-hidden`.
- **Glyph palette:** `</>` `{ }` `=>` `&&` `0101` `λ` `∑` `π` `∞` `Δ` `git push`. Show them in mono at 7–15% opacity in the background.
- Never put emojis in buttons that perform destructive actions, or in error messages.

---

## 12. Accessibility checklist

- Every interactive element gets the global blue focus ring. Don't remove outlines.
- Text contrast: ink on canvas, yellow or mint; white on blue or coral; `#71717A` only for small secondary text.
- Overlays use `role="dialog"` with `aria-modal`, can be dismissed from the keyboard, and lock body scroll while open.
- Progress uses `role="progressbar"` with `aria-valuenow`; decorative counters are `aria-hidden`.
- Every animation has a `prefers-reduced-motion` fallback.
