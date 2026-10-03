"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, UserPlus } from "lucide-react";
import { AuthDivider, AuthError, GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { BrandLoader } from "@/components/BrandLoader";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="brutal-card rounded-2xl p-6 md:p-8 bg-surface">
      {isPending && (
        <BrandLoader
          overlay
          title="Creating your account"
          steps={["Securing your password", "Creating workspace", "Preparing a few questions"]}
        />
      )}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00E676] text-on-accent border-2 border-ink rounded-md font-mono text-xs font-bold uppercase mb-6 shadow-brutal-sm">
        <UserPlus className="w-3.5 h-3.5" />
        Create Account
      </div>

      <AuthError message={state?.error} />

      <GoogleSignInButton label="Sign up with Google" />
      <AuthDivider />

      <form action={formAction} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          required
          minLength={2}
          placeholder="Ada Lovelace"
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isPending}
            className="w-full gap-2 font-black text-base"
          >
            {isPending ? "Creating account..." : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm font-bold text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline decoration-2 decoration-[#FFEB3B] underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
