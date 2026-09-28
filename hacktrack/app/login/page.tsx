"use client";

import * as React from "react";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-[85dvh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFEB3B] border-3 border-[#121212] shadow-brutal rounded-2xl mb-4 font-black text-2xl">
            HT
          </div>
          <h1 className="font-black text-3xl md:text-4xl text-[#121212] tracking-tight">
            HACKTRACK
          </h1>
          <p className="text-sm font-bold text-[#71717A] mt-1">
            Sign in to your Administrator Command Center
          </p>
        </div>

        {/* Login Box */}
        <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFEB3B] border-2 border-[#121212] rounded-md font-mono text-xs font-bold uppercase mb-6 shadow-brutal-sm">
            <Lock className="w-3.5 h-3.5" />
            Admin Authentication
          </div>

          {state?.error && (
            <div className="mb-6 p-3.5 bg-[#FF5252]/15 border-2 border-[#FF5252] rounded-lg text-xs font-bold text-[#FF5252] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5252]" />
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <Input
              label="Admin Email"
              type="email"
              name="email"
              required
              placeholder="admin@hacktrack.com"
              defaultValue="admin@hacktrack.com"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              required
              placeholder="••••••••••••"
              defaultValue="adminpassword123"
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

          {/* Seed hint */}
          <div className="mt-6 pt-5 border-t-2 border-[#121212] text-center">
            <p className="text-xs font-mono text-[#71717A]">
              Default Seed:{" "}
              <strong className="text-[#121212]">admin@hacktrack.com</strong> /{" "}
              <strong className="text-[#121212]">adminpassword123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
