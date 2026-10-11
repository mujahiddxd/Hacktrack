"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader, PageShell, SectionHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  getGoogleStatusAction,
  getGoogleAuthUrlAction,
  sendDirectTestEmailAction,
  connectDemoAccountAction,
  disconnectGoogleAction,
} from "@/actions/google";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function TestEmailClient({ userEmail }: { userEmail: string }) {
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean;
    email?: string;
    isDemo?: boolean;
    isSmtp?: boolean;
    updatedAt?: Date | string;
  } | null>(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Form states
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("HackTrack Live Test Broadcast");
  const [message, setMessage] = useState(
    "Hello,\n\nThis is a live test email sent from HackTrack to verify that email dispatch is functioning properly.\n\nSent at: " +
      new Date().toLocaleString() +
      "\n\nHappy Hacking!\nHackTrack Command Center"
  );

  // Dispatch state
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success?: boolean;
    messageId?: string;
    timestamp?: string;
    error?: string;
    isDemo?: boolean;
    isRealDelivery?: boolean;
  } | null>(null);

  // Load status on mount and handle ?connected=true
  useEffect(() => {
    loadStatus();

    // Check if redirected back after OAuth
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("connected") === "true") {
        toast.success("Google Account successfully connected! You are ready to send live test emails.");
        // Clean URL query parameter without refresh
        window.history.replaceState({}, "", "/test-email");
      } else if (params.get("error")) {
        toast.error("Google OAuth error: " + params.get("error"));
        window.history.replaceState({}, "", "/test-email");
      }
    }
  }, []);

  async function loadStatus() {
    setIsLoadingStatus(true);
    try {
      const res = await getGoogleStatusAction();
      setGoogleStatus(res);
      if (res?.email && !toEmail) {
        // Pre-fill recipient with connected email for easy self-testing
        setToEmail(res.email);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStatus(false);
    }
  }

  async function handleConnectGoogle() {
    try {
      const url = await getGoogleAuthUrlAction("/test-email");
      if (url) {
        window.location.href = url;
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to get auth URL");
    }
  }

  async function handleConnectDirectly(emailToUse = userEmail) {
    setIsLoadingStatus(true);
    try {
      await connectDemoAccountAction(emailToUse);
      toast.success(`Demo sender ${emailToUse} connected.`);
      await loadStatus();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to connect account");
    } finally {
      setIsLoadingStatus(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    if (!googleStatus?.connected) {
      toast.error("Please connect your Google Account first using the button above.");
      return;
    }

    if (!toEmail.trim()) {
      toast.error("Please enter a recipient email address.");
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await sendDirectTestEmailAction(toEmail, subject, message);
      if (res.error) {
        setSendResult({ error: res.error });
        toast.error("Failed to send email: " + res.error);
      } else {
        setSendResult({
          success: true,
          messageId: res.messageId,
          timestamp: res.timestamp,
          isDemo: res.isDemo,
          isRealDelivery: res.isRealDelivery,
        });
        if (res.isDemo) {
          toast.warning("Simulated test dispatch (no real email delivered).");
        } else {
          toast.success("Real test email delivered successfully!");
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error";
      setSendResult({ error: errMsg });
      toast.error(errMsg);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        backHref="/settings"
        backLabel="Settings"
        icon={Mail}
        eyebrow="Diagnostic tool"
        title="Email test"
        description="Check your sending connection and deliver a test email to any inbox."
      />

      {/* Connection Status Card */}
      <Card className="bg-surface p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-ink">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`shrink-0 p-2.5 rounded-xl border-2 border-ink ${
                googleStatus?.connected ? "bg-[#00E676] text-on-accent" : "bg-[#FF5252] text-white"
              }`}
            >
              {googleStatus?.connected ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-lg text-ink">
                  {googleStatus?.connected ? "Gmail connected" : "Gmail not connected"}
                </h2>
                {googleStatus?.connected && (
                  <Badge variant={googleStatus.isDemo ? "yellow" : "mint"}>
                    {googleStatus.isDemo
                      ? "Simulator / Demo"
                      : googleStatus.isSmtp
                      ? "Live Gmail SMTP"
                      : "Live Google API"}
                  </Badge>
                )}
              </div>
              <p className="break-all text-xs font-mono text-muted">
                {googleStatus?.connected ? (
                  <>Sender: <strong className="text-ink">{googleStatus.email}</strong></>
                ) : (
                  "No Gmail account currently linked to HackTrack"
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStatus}
              disabled={isLoadingStatus}
              title="Refresh connection status"
              aria-label="Refresh connection status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? "animate-spin" : ""}`} />
            </Button>
            {!googleStatus?.connected ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConnectGoogle}
                className="gap-1.5 font-bold"
              >
                <ExternalLink className="w-4 h-4" />
                Connect Google Account
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await disconnectGoogleAction();
                    toast.success("Account disconnected.");
                    await loadStatus();
                  }}
                  className="text-xs"
                >
                  Disconnect
                </Button>
                <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Settings
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Real Mode Note */}
        {googleStatus?.connected && !googleStatus.isDemo && (
          <div className="p-3 bg-[#00E676]/10 border-2 border-[#00E676] rounded-xl text-xs font-medium text-ink flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00E676] shrink-0" />
            <span>
              Real Gmail dispatch is active! Emails sent from HackTrack will be delivered directly from <strong>{googleStatus.email}</strong> to real inboxes.
            </span>
          </div>
        )}
      </Card>

      {/* Interactive Send Form */}
      <Card className="bg-surface p-6 space-y-6">
        <SectionHeader
          className="mb-0"
          icon={Send}
          title="Send a test email"
          subtitle="Delivered immediately to the address below."
        />

        {!googleStatus?.connected && !isLoadingStatus && (
          <div className="p-4 sm:p-5 bg-[#FFEB3B] text-on-accent border-3 border-ink rounded-xl shadow-brutal-sm space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-ink shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-sm text-ink">
                  Connect Your Gmail Account (2 Ways to Proceed)
                </h4>
                <p className="text-xs font-bold text-ink/80 mt-1">
                  Choose how you want to connect <strong className="break-all">{userEmail}</strong>:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Option A: Direct 1-Click */}
              <div className="p-3 bg-surface border-2 border-ink rounded-lg space-y-2 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 bg-[#00E676] text-on-accent text-[10px] font-mono font-bold uppercase rounded mb-1">
                    Instant · simulated
                  </span>
                  <h5 className="font-black text-xs text-ink">
                    Use a demo sender
                  </h5>
                  <p className="text-[11px] text-muted mt-0.5 font-medium leading-tight">
                    Simulates delivery for {userEmail} so you can test scheduling without Google Cloud setup. No real email is sent.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleConnectDirectly()}
                  className="w-full gap-1.5 font-black text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connect demo sender
                </Button>
              </div>

              {/* Option B: Fix Google Cloud Redirect URI */}
              <div className="p-3 bg-surface border-2 border-ink rounded-lg space-y-2 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 bg-[#2196F3] text-white text-[10px] font-mono font-bold uppercase rounded mb-1">
                    Full Google API
                  </span>
                  <h5 className="font-black text-xs text-ink">
                    Fix Redirect URI & Use Live OAuth
                  </h5>
                  <p className="text-[11px] text-muted mt-0.5 font-medium leading-tight">
                    Add <code className="break-all bg-quiet px-1 py-0.5 rounded text-[10px]">http://localhost:3000/api/auth/google/callback</code> to Authorized redirect URIs in Google Cloud Console.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleConnectGoogle}
                  className="w-full gap-1.5 font-bold text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Authenticate with Google
                </Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Recipient Email Address (To:)
            </label>
            <Input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="e.g. your-email@gmail.com"
              required
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted mt-1 font-medium">
              Enter the email address where you want to receive the test broadcast.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Subject
            </label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
              Message Body
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Write test message..."
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSending}
              className="w-full sm:w-auto gap-2 font-black"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Dispatching Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test Email Now
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Live Execution Console / Result Box */}
        {sendResult && (
          <div
            className={`p-5 rounded-xl border-3 border-ink shadow-brutal-sm space-y-2 ${
              sendResult.success ? "bg-[#00E676]/15" : "bg-[#FF5252]/15"
            }`}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-ink" />
              <h4 className="font-mono font-black text-sm uppercase text-ink">
                {sendResult.success ? "✓ Dispatch Succeeded" : "✕ Dispatch Failed"}
              </h4>
            </div>

            {sendResult.success ? (
              <div className="text-xs font-mono space-y-1.5 text-ink">
                <p>
                  <strong>Delivery Mode:</strong>{" "}
                  {sendResult.isDemo ? (
                    <span className="text-[#E65100] font-black">LOCAL SIMULATOR (No internet email sent)</span>
                  ) : (
                    <span className="text-[#00C853] font-black">REAL OUTGOING DELIVERY (Google Mail Servers)</span>
                  )}
                </p>
                <p className="break-all">
                  <strong>Message ID:</strong> {sendResult.messageId}
                </p>
                <p>
                  <strong>Timestamp:</strong> {sendResult.timestamp}
                </p>
                {sendResult.isDemo ? (
                  <div className="p-2.5 bg-[#FFEB3B] border-2 border-ink rounded-lg text-xs font-bold text-on-accent mt-2">
                    ⚠️ Note: This was a simulated test dispatch. The email was logged in your console/database, but Google mail servers did NOT deliver it across the internet because no live credentials (App Password or Google OAuth) have been authorized yet.
                  </div>
                ) : (
                  <p className="text-[#00C853] font-bold mt-2">
                    👉 Delivered! Check your inbox at <strong>{toEmail}</strong> (also check the Spam / Updates tab if not in Primary).
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs font-mono space-y-2 text-ink">
                <p>
                  <strong>Error Message:</strong>
                </p>
                <div className="p-3 bg-surface rounded-lg border-2 border-ink text-[#FF1744] font-mono break-all whitespace-pre-wrap">
                  {sendResult.error}
                </div>
                <p className="text-muted mt-2">
                  Tip: If Gmail is not connected, click <strong>Connect Google Account</strong> above or in Settings to authenticate your Gmail.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
