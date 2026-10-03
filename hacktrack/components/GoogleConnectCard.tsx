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
import { SectionHeader } from "@/components/ui/page-header";
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
    <section className="brutal-card rounded-2xl p-5 sm:p-6 md:p-8 bg-surface">
      <SectionHeader
        icon={Mail}
        title="Gmail sending"
        subtitle="Connect via Google OAuth so scheduled broadcasts go out from your inbox."
        actions={
          account ? (
            <Badge variant="mint" className="py-1 px-3">
              ● {account.isDemo ? "Demo connected" : "Connected"}
            </Badge>
          ) : (
            <Badge variant="coral" className="py-1 px-3">
              ✕ Not connected
            </Badge>
          )
        }
      />

      {account ? (
        <div className="space-y-6">
          <div className="p-4 bg-[#00E676]/10 border-2 border-[#00E676] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 shrink-0 bg-[#00E676] text-on-accent border-2 border-ink rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-ink" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block font-bold">
                  Active Broadcasting Account {account.isDemo && "(Simulation Mode)"}
                </span>
                <strong className="block break-all text-sm sm:text-base text-ink font-mono font-bold">
                  {account.email}
                </strong>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full gap-1.5 sm:w-auto sm:shrink-0"
            >
              <LogOut className="w-4 h-4" />
              {loading ? "Disconnecting..." : "Disconnect Account"}
            </Button>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-muted font-medium">
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
          <div className="p-4 bg-[#FF5252]/10 border-2 border-[#FF5252] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 bg-[#FF5252] text-white border-2 border-ink rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-ink">
                  No Gmail Account Connected
                </h4>
                <p className="text-xs text-muted font-medium">
                  Connect your Google account to grant permissions for automated email delivery.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
              <Button
                variant="mint"
                size="md"
                onClick={handleConnectDemo}
                disabled={loading}
                className="gap-1.5 font-bold"
                title="Connect instant demo account to test scheduling right away"
              >
                <Zap className="w-4 h-4" />
                Use demo account
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
                {loading ? "Redirecting..." : "Connect Gmail"}
              </Button>
            </div>
          </div>

          <p className="text-xs font-medium text-muted">
            * Note: If using official Google OAuth, ensure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> are set in your <code>hacktrack/.env</code> file. Or click <strong>Use demo account</strong> to test full end-to-end background scheduling right now!
          </p>
        </div>
      )}
    </section>
  );
}
