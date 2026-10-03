"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { GraduationCap, KeyRound, Link2, MapPin, Trash2, UserRound } from "lucide-react";
import {
  changePasswordAction,
  deleteAccountAction,
  unlinkGoogleAction,
  updateProfileAction,
  updateProfileDetailsAction,
  type CurrentUser,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChipSelect, ChoiceCards } from "@/components/ui/chip-select";
import { SectionHeader } from "@/components/ui/page-header";
import { AuthError } from "@/components/auth/GoogleSignInButton";
import {
  DEGREE_OPTIONS,
  EXPERIENCE_OPTIONS,
  INTEREST_OPTIONS,
  ROLE_OPTIONS,
  SKILL_OPTIONS,
} from "@/lib/profile-options";

type FormState = { error?: string; success?: string } | null;

function useSuccessToast(state: FormState) {
  useEffect(() => {
    if (state?.success) toast.success(state.success);
  }, [state]);
}

function Panel({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={`brutal-card rounded-2xl bg-surface p-5 sm:p-6 md:p-8 ${danger ? "border-[#FF5252]" : ""}`}>
      {children}
    </section>
  );
}

function SubmitRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col pt-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">{children}</div>;
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Sticky identity card shown beside the settings on wide screens. */
export function AccountSummary({ user }: { user: CurrentUser }) {
  const role = ROLE_OPTIONS.find((r) => r.value === user.profile.role)?.label;
  const location = [user.profile.city, user.profile.country].filter(Boolean).join(", ");
  const education = [user.profile.degree, user.profile.fieldOfStudy].filter(Boolean).join(" · ");
  const skills = user.profile.skills?.split(",").filter(Boolean) ?? [];

  return (
    <aside className="brutal-card rounded-2xl bg-surface p-6 lg:sticky lg:top-24">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-3 border-ink bg-[#FFEB3B] text-on-accent text-xl font-black shadow-brutal-sm">
          {initials(user.name, user.email)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-ink">{user.name || "Unnamed builder"}</p>
          <p className="truncate font-mono text-xs font-bold text-muted">{user.email}</p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 border-t-2 border-ink pt-5 text-sm">
        {role && (
          <div className="flex items-start gap-2.5">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <dd className="font-bold text-ink">{role}</dd>
          </div>
        )}
        {education && (
          <div className="flex items-start gap-2.5">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <dd className="font-medium text-ink">
              {education}
              {user.profile.institution && <span className="block text-xs text-muted">{user.profile.institution}</span>}
            </dd>
          </div>
        )}
        {location && (
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <dd className="font-medium text-ink">{location}</dd>
          </div>
        )}
        {!role && !education && !location && (
          <p className="text-sm font-medium text-muted">Add your details below to complete your profile.</p>
        )}
      </dl>

      {skills.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="rounded-full border-2 border-ink bg-canvas px-2.5 py-0.5 text-[11px] font-bold">
              {s}
            </span>
          ))}
        </div>
      )}

      <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
        Member since{" "}
        {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>
    </aside>
  );
}

export function AccountSettings({ user }: { user: CurrentUser }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, null);
  const [detailsState, detailsAction, detailsPending] = useActionState(updateProfileDetailsAction, null);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, null);
  const [unlinkPending, startUnlink] = useTransition();
  const { profile } = user;

  useSuccessToast(profileState);
  useSuccessToast(detailsState);
  useSuccessToast(passwordState);

  function handleUnlink() {
    startUnlink(async () => {
      const result = await unlinkGoogleAction();
      if (result?.error) toast.error(result.error);
      else if (result?.success) toast.success(result.success);
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Basic account */}
      <Panel>
        <SectionHeader icon={UserRound} title="Account" subtitle="Your name and sign-in email" />
        <AuthError message={profileState?.error} />
        <form action={profileAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" name="name" required minLength={2} defaultValue={user.name ?? ""} autoComplete="name" />
            <Input
              label="Email"
              type="email"
              name="email"
              required
              defaultValue={user.email}
              autoComplete="email"
              helperText={user.hasPassword ? undefined : "Set a password below before changing your email."}
            />
          </div>
          <SubmitRow>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Saving..." : "Save account"}
            </Button>
          </SubmitRow>
        </form>
      </Panel>

      {/* Profile details (same fields as onboarding) */}
      <Panel>
        <SectionHeader
          icon={GraduationCap}
          title="Profile details"
          subtitle="Education, location, skills and links — clear a field to remove it"
          iconClassName="bg-[#00E676] text-on-accent"
        />
        <AuthError message={detailsState?.error} />
        <form action={detailsAction} className="space-y-6">
          <ChoiceCards name="role" label="I am a…" options={ROLE_OPTIONS} defaultValue={profile.role} columns={2} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select name="degree" label="Degree" options={DEGREE_OPTIONS} defaultValue={profile.degree ?? ""} />
            <Input name="fieldOfStudy" label="Field of study" defaultValue={profile.fieldOfStudy ?? ""} />
            <Input name="institution" label="College / Company" defaultValue={profile.institution ?? ""} />
            <Input
              name="graduationYear"
              label="Graduation year"
              type="number"
              inputMode="numeric"
              defaultValue={profile.graduationYear ?? ""}
            />
            <Input name="city" label="City" autoComplete="address-level2" defaultValue={profile.city ?? ""} />
            <Input name="country" label="Country" autoComplete="country-name" defaultValue={profile.country ?? ""} />
          </div>

          <ChoiceCards
            name="experienceLevel"
            label="Hackathon experience"
            options={EXPERIENCE_OPTIONS}
            defaultValue={profile.experienceLevel}
            columns={3}
          />
          <ChipSelect name="skills" label="Top skills" options={SKILL_OPTIONS} defaultValue={profile.skills} max={8} />
          <ChipSelect name="interests" label="Interested domains" options={INTEREST_OPTIONS} defaultValue={profile.interests} max={5} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="githubUrl" label="GitHub" type="url" placeholder="https://github.com/you" defaultValue={profile.githubUrl ?? ""} />
            <Input
              name="linkedinUrl"
              label="LinkedIn"
              type="url"
              placeholder="https://linkedin.com/in/you"
              defaultValue={profile.linkedinUrl ?? ""}
            />
          </div>

          <SubmitRow>
            <Button type="submit" variant="mint" disabled={detailsPending}>
              {detailsPending ? "Saving..." : "Save details"}
            </Button>
          </SubmitRow>
        </form>
      </Panel>

      {/* Password */}
      <Panel>
        <SectionHeader
          icon={KeyRound}
          title={user.hasPassword ? "Change password" : "Set a password"}
          subtitle={user.hasPassword ? "Use at least 8 characters" : "Lets you sign in with email as well as Google"}
          iconClassName="bg-[#2196F3] text-white"
        />
        <AuthError message={passwordState?.error} />
        <form action={passwordAction} className="space-y-4">
          {user.hasPassword && (
            <Input label="Current password" type="password" name="currentPassword" required autoComplete="current-password" />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="New password" type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
            <Input label="Confirm new password" type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" />
          </div>
          <SubmitRow>
            <Button type="submit" variant="blue" disabled={passwordPending}>
              {passwordPending ? "Saving..." : user.hasPassword ? "Update password" : "Set password"}
            </Button>
          </SubmitRow>
        </form>
      </Panel>

      {/* Sign-in methods */}
      <Panel>
        <SectionHeader icon={Link2} title="Google sign-in" subtitle="Sign in with your Google account" iconClassName="bg-[#FFEB3B] text-on-accent" />
        {user.hasGoogle ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="h-2.5 w-2.5 rounded-full border border-ink bg-[#00E676] text-on-accent" />
              Linked to this account
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={unlinkPending || !user.hasPassword}
              title={user.hasPassword ? undefined : "Set a password first"}
            >
              {unlinkPending ? "Unlinking..." : "Unlink Google"}
            </Button>
          </div>
        ) : (
          <p className="text-sm font-medium leading-relaxed text-body">
            Not linked. Sign out and use <strong className="text-ink">Continue with Google</strong> with a Google
            account whose email is <strong className="break-all text-ink">{user.email}</strong> to link it automatically.
          </p>
        )}
      </Panel>

      {/* Danger zone */}
      <Panel danger>
        <SectionHeader
          icon={Trash2}
          title="Delete account"
          subtitle="Permanently removes your account, hackathons, participants and scheduled messages"
          iconClassName="bg-[#FF5252] text-white"
        />
        <AuthError message={deleteState?.error} />
        <form
          action={deleteAction}
          className="space-y-4"
          onSubmit={(e) => {
            if (!confirm("This cannot be undone. Delete your account and all of its data?")) e.preventDefault();
          }}
        >
          <Input label={`Type ${user.email} to confirm`} name="confirmation" required autoComplete="off" placeholder={user.email} />
          <SubmitRow>
            <Button type="submit" variant="secondary" disabled={deletePending}>
              {deletePending ? "Deleting..." : "Delete my account"}
            </Button>
          </SubmitRow>
        </form>
      </Panel>
    </div>
  );
}
