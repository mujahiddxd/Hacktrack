"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  getGoogleAuthUrlAction,
  disconnectGoogleAction,
  connectDemoAccountAction,
} from "@/actions/google";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialAccount: {
    email: string;
    connected: boolean;
    isDemo?: boolean;
    updatedAt: Date | string;
  } | null;
}

export function GoogleConnectCard({ initialAccount }: Props) {
  const searchParams = useSearchParams();
  const [account, setAccount] = useState(initialAccount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("Gmail account successfully connected via Google OAuth!");
    }
    const error = searchParams.get("error");
    if (error) {
      toast.error(`OAuth Notice: ${error}`);
    }
  }, [searchParams]);

  async function handleConnect() {
    setLoading(true);
    try {
      const url = await getGoogleAuthUrlAction();
      window.location.href = url;
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to generate Google Auth URL. Check GOOGLE_CLIENT_ID in .env."
      );
      setLoading(false);
    }
  }

  async function handleConnectDemo() {
    setLoading(true);
    try {
      await connectDemoAccountAction("organizer.hacktrack@gmail.com");
      setAccount({
        email: "organizer.hacktrack@gmail.com",
        connected: true,
        isDemo: true,
        updatedAt: new Date(),
      });
      toast.success("Demo Gmail account connected! Ready for immediate scheduling.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to connect demo account");
    }
    setLoading(false);
  }

  async function handleDisconnect() {
    if (
      !confirm(
        "Are you sure you want to disconnect this Gmail account? Scheduled broadcasts will not be sent until an account is reconnected."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await disconnectGoogleAction();
      setAccount(null);
      toast.success("Gmail account disconnected.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect account");
    }
    setLoading(false);
  }

  return (
    <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FFEB3B] border-3 border-[#121212] shadow-brutal-sm flex items-center justify-center font-black rounded-xl">
            <Mail className="w-6 h-6 text-[#121212]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#121212] tracking-tight">
              Gmail Dispatch Integration
            </h2>
            <p className="text-xs font-bold text-[#71717A]">
              Connect via Google OAuth to allow background email broadcasting.
            </p>
          </div>
        </div>

        <div>
          {account ? (
            <Badge variant="mint" className="text-xs py-1 px-3">
              ● {account.isDemo ? "Demo Connected" : "Google Connected"}
            </Badge>
          ) : (
            <Badge variant="coral" className="text-xs py-1 px-3">
              ✕ Disconnected
            </Badge>
          )}
        </div>
      </div>

      {account ? (
        <div className="space-y-6">
          <div className="p-4 bg-[#00E676]/10 border-2 border-[#00E676] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00E676] border-2 border-[#121212] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#121212]" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] block font-bold">
                  Active Broadcasting Account {account.isDemo && "(Simulation Mode)"}
                </span>
                <strong className="text-base text-[#121212] font-mono font-bold">
                  {account.email}
                </strong>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnect}
              disabled={loading}
              className="gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              {loading ? "Disconnecting..." : "Disconnect Account"}
            </Button>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-[#71717A] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />
            <span>
              {account.isDemo
                ? "Demo Mode Active: When scheduled messages are due, the background daemon worker logs simulated delivery with delivery latency and updates recipient statuses (SENT / FAILED) in real time."
                : "Offline refresh tokens are stored securely in MySQL and used by the background daemon worker to dispatch emails at the scheduled hour without requiring your browser to be open."}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-[#FF5252]/10 border-2 border-[#FF5252] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF5252] text-white border-2 border-[#121212] rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#121212]">
                  No Gmail Account Connected
                </h4>
                <p className="text-xs text-[#71717A] font-medium">
                  Connect your Google account to grant permissions for automated email delivery.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="mint"
                size="md"
                onClick={handleConnectDemo}
                disabled={loading}
                className="gap-1.5 font-bold"
                title="Connect instant demo account to test scheduling right away"
              >
                <Zap className="w-4 h-4" />
                Connect Demo Account (Instant)
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleConnect}
                disabled={loading}
                className="gap-2 font-black"
                title="Connect via official Google Cloud OAuth"
              >
                <ExternalLink className="w-4 h-4" />
                {loading ? "Redirecting..." : "Connect Official Gmail"}
              </Button>
            </div>
          </div>

          <p className="text-xs font-medium text-[#71717A]">
            * Note: If using official Google OAuth, ensure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> are set in your <code>hacktrack/.env</code> file. Or click <strong>Connect Demo Account (Instant)</strong> to test full end-to-end background scheduling right now!
          </p>
        </div>
      )}
    </div>
  );
}
