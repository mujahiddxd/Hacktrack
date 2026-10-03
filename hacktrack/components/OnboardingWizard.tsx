"use client";

import * as React from "react";
import { useActionState, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, GraduationCap, MapPin, Rocket } from "lucide-react";
import { completeOnboardingAction, type CurrentUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChipSelect, ChoiceCards } from "@/components/ui/chip-select";
import { AuthError } from "@/components/auth/GoogleSignInButton";
import { BrandLoader } from "@/components/BrandLoader";
import {
  DEGREE_OPTIONS,
  EXPERIENCE_OPTIONS,
  INTEREST_OPTIONS,
  ROLE_OPTIONS,
  SKILL_OPTIONS,
} from "@/lib/profile-options";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "About you",
    heading: "Tell us a bit about yourself",
    description: "Your role and education help us tailor HackTrack to how you work.",
    icon: GraduationCap,
  },
  {
    title: "Location",
    heading: "Where are you based?",
    description: "Used to show event times sensibly and highlight hackathons near you.",
    icon: MapPin,
  },
  {
    title: "Skills & interests",
    heading: "What do you build with?",
    description: "Pick what fits — you can change all of this later from My Account.",
    icon: Rocket,
  },
] as const;

/** Titled group of fields inside a step, so each screen reads as a few clear blocks. */
function FieldGroup({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border-2 border-ink bg-surface p-5 sm:p-6">
      <div>
        <h3 className="text-base sm:text-lg font-black text-ink">{title}</h3>
        {hint && <p className="mt-0.5 text-sm font-medium text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function OnboardingWizard({ name, profile }: { name: string | null; profile: CurrentUser["profile"] }) {
  const [state, formAction, isPending] = useActionState(completeOnboardingAction, null);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const firstName = name?.trim().split(/\s+/)[0];
  const progress = ((step + 1) / STEPS.length) * 100;

  /** Light per-step checks; the server re-validates everything on submit. */
  function validateStep(index: number): string | null {
    const data = new FormData(formRef.current!);
    if (index === 0 && !data.get("role")) return "Pick the option that describes you best.";
    if (index === 1 && !String(data.get("country") ?? "").trim()) return "Please enter your country.";
    return null;
  }

  function goTo(index: number) {
    setStep(index);
    // New step starts at the top, on both the scroll container (desktop) and the window (phones)
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }

  function goNext() {
    const error = validateStep(step);
    setStepError(error);
    if (!error) goTo(Math.min(step + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    goTo(Math.max(step - 1, 0));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Enter on an earlier step should advance, not submit half the answers
    if (e.key === "Enter" && !isLast && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      goNext();
    }
  }

  const skipButton = (
    <button
      type="submit"
      form="onboarding-form"
      name="intent"
      value="skip"
      formNoValidate
      disabled={isPending}
      className="text-sm font-bold text-muted underline-offset-4 hover:text-ink hover:underline"
    >
      Skip for now
    </button>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col lg:grid lg:h-[100dvh] lg:grid-cols-[minmax(300px,380px)_1fr]">
      {isPending && (
        <BrandLoader
          overlay
          title="Personalising your workspace"
          steps={["Saving your answers", "Tailoring your dashboard", "Almost there"]}
        />
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#121212] p-10 text-white lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 bottom-10 select-none font-mono text-[10rem] font-black leading-none text-white/[0.04]">
          {"{}"}
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border-3 border-white bg-[#FFEB3B] text-base font-black text-on-accent">
              HT
            </div>
            <span className="text-xl font-black tracking-tight">HACKTRACK</span>
          </div>

          <h1 className="mt-12 text-3xl font-black leading-tight">
            {firstName ? `Welcome, ${firstName}!` : "Welcome!"}
          </h1>
          <p className="mt-2 text-base font-medium leading-relaxed text-white/70">
            Three quick steps to set up your profile. It takes under a minute.
          </p>

          <ol className="mt-10 space-y-2" aria-label="Setup progress">
            {STEPS.map((s, i) => {
              const isDone = i < step;
              const isCurrent = i === step;
              const Icon = s.icon;
              return (
                <li key={s.title} aria-current={isCurrent ? "step" : undefined}>
                  <button
                    type="button"
                    // Only completed steps are clickable; jumping ahead would skip validation
                    onClick={() => isDone && goTo(i)}
                    disabled={!isDone}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors",
                      isCurrent && "bg-white text-[#121212]", // sidebar is always dark, so this card stays fixed white
                      isDone && "text-white hover:bg-white/10",
                      !isCurrent && !isDone && "text-white/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2",
                        isCurrent && "border-[#121212] bg-[#FFEB3B] text-on-accent",
                        isDone && "border-[#00E676] bg-[#00E676] text-on-accent",
                        !isCurrent && !isDone && "border-white/30"
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-wider opacity-60">Step {i + 1}</span>
                      <span className="block text-base font-black">{s.title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="relative text-sm font-medium text-white/60">
          You can edit these answers anytime from <span className="font-bold text-white">My Account</span>.
        </p>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Phone/tablet top bar */}
        <header className="sticky top-0 z-20 border-b-2 border-ink bg-canvas/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink bg-[#FFEB3B] text-on-accent text-sm font-black">
                HT
              </div>
              <span className="text-sm font-bold text-body">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>
            {skipButton}
          </div>
          <div className="h-1.5 bg-subtle">
            <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <div ref={contentRef} className="flex-1 lg:overflow-y-auto">
          <form
            id="onboarding-form"
            ref={formRef}
            action={formAction}
            onKeyDown={handleKeyDown}
            className="mx-auto w-full max-w-3xl px-4 pb-32 pt-8 sm:px-6 sm:pt-10 lg:px-12 lg:pb-12 lg:pt-16"
          >
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-wider text-muted">
                Step {step + 1} · {current.title}
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-black leading-tight tracking-tight text-ink">
                {current.heading}
              </h2>
              <p className="mt-2 max-w-xl text-base sm:text-lg font-medium leading-relaxed text-body">
                {current.description}
              </p>
            </div>

            <AuthError message={stepError || state?.error} />

            {/* All steps stay mounted (just hidden) so one submit carries every answer */}
            <div className={cn("space-y-5", step !== 0 && "hidden")}>
              <FieldGroup title="Your role" hint="Choose the one that fits best.">
                <ChoiceCards name="role" label="I am a…" options={ROLE_OPTIONS} defaultValue={profile.role} columns={2} />
              </FieldGroup>
              <FieldGroup title="Education">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select name="degree" label="Degree" options={DEGREE_OPTIONS} defaultValue={profile.degree ?? ""} />
                  <Input
                    name="fieldOfStudy"
                    label="Field of study"
                    placeholder="e.g. Computer Science"
                    defaultValue={profile.fieldOfStudy ?? ""}
                  />
                  <Input
                    name="institution"
                    label="College / Company"
                    placeholder="e.g. IIT Bombay"
                    defaultValue={profile.institution ?? ""}
                  />
                  <Input
                    name="graduationYear"
                    label="Graduation year"
                    type="number"
                    inputMode="numeric"
                    placeholder={String(new Date().getFullYear() + 1)}
                    defaultValue={profile.graduationYear ?? ""}
                  />
                </div>
              </FieldGroup>
            </div>

            <div className={cn("space-y-5", step !== 1 && "hidden")}>
              <FieldGroup title="Location">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    name="city"
                    label="City"
                    placeholder="e.g. Bengaluru"
                    autoComplete="address-level2"
                    defaultValue={profile.city ?? ""}
                  />
                  <Input
                    name="country"
                    label="Country"
                    placeholder="e.g. India"
                    autoComplete="country-name"
                    defaultValue={profile.country ?? ""}
                  />
                </div>
              </FieldGroup>
            </div>

            <div className={cn("space-y-5", step !== 2 && "hidden")}>
              <FieldGroup title="Hackathon experience">
                <ChoiceCards
                  name="experienceLevel"
                  label="How many hackathons have you done?"
                  options={EXPERIENCE_OPTIONS}
                  defaultValue={profile.experienceLevel}
                  columns={3}
                />
              </FieldGroup>
              <FieldGroup title="Skills & interests" hint="Tap to select. Tap again to remove.">
                <div className="space-y-6">
                  <ChipSelect name="skills" label="Top skills" options={SKILL_OPTIONS} defaultValue={profile.skills} max={8} />
                  <ChipSelect
                    name="interests"
                    label="Interested domains"
                    options={INTEREST_OPTIONS}
                    defaultValue={profile.interests}
                    max={5}
                  />
                </div>
              </FieldGroup>
              <FieldGroup title="Profiles" hint="Optional.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    name="githubUrl"
                    label="GitHub"
                    type="url"
                    placeholder="https://github.com/you"
                    defaultValue={profile.githubUrl ?? ""}
                  />
                  <Input
                    name="linkedinUrl"
                    label="LinkedIn"
                    type="url"
                    placeholder="https://linkedin.com/in/you"
                    defaultValue={profile.linkedinUrl ?? ""}
                  />
                </div>
              </FieldGroup>
            </div>
          </form>
        </div>

        {/* Action bar: fixed to the bottom on phones, pinned under the scroll area on desktop */}
        <footer className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-surface lg:static">
          <div className="hidden h-1.5 bg-subtle lg:block">
            <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-12 lg:py-5">
            <div className="hidden lg:block">{skipButton}</div>
            <div className="flex flex-1 items-center gap-3 lg:flex-none">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={goBack} disabled={isPending} className="flex-1 lg:flex-none">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              {isLast ? (
                <Button
                  type="submit"
                  form="onboarding-form"
                  name="intent"
                  value="save"
                  size="lg"
                  disabled={isPending}
                  className="flex-[2] font-black lg:flex-none"
                >
                  Finish setup
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={goNext} className="flex-[2] font-black lg:flex-none">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
