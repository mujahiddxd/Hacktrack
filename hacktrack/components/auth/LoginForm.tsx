"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock } from "lucide-react";
import { AuthDivider, AuthError, GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { BrandLoader } from "@/components/BrandLoader";

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="brutal-card rounded-2xl p-6 md:p-8 bg-surface">
      {isPending && (
        <BrandLoader
          overlay
          title="Signing you in"
          steps={["Checking credentials", "Verifying session", "Opening your dashboard"]}
        />
      )}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFEB3B] text-on-accent border-2 border-ink rounded-md font-mono text-xs font-bold uppercase mb-6 shadow-brutal-sm">
        <Lock className="w-3.5 h-3.5" />
        Sign In
      </div>

      <AuthError message={state?.error || oauthError} />

      <GoogleSignInButton />
      <AuthDivider />

      <form action={formAction} className="space-y-4">
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
          placeholder="••••••••••••"
          autoComplete="current-password"
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isPending}
            className="w-full gap-2 font-black text-base"
          >
            {isPending ? "Authenticating..." : "Enter Command Center"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm font-bold text-muted">
        New to HackTrack?{" "}
        <Link href="/register" className="text-ink underline decoration-2 decoration-[#FFEB3B] underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
