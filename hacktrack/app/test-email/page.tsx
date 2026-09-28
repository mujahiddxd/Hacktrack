"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function TestEmailPage() {
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean;
    email?: string;
    isDemo?: boolean;
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

  async function handleConnectDirectly(emailToUse = "mujahidchoudhry37@gmail.com") {
    setIsLoadingStatus(true);
    try {
      await connectDemoAccountAction(emailToUse);
      toast.success(`Account ${emailToUse} connected directly!`);
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Page Title */}
      <div className="p-6 brutal-card rounded-2xl bg-[#FFEB3B]">
        <span className="inline-block px-2.5 py-0.5 bg-[#121212] text-white text-xs font-mono font-bold uppercase rounded mb-2">
          Diagnostic Tool
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-[#121212] tracking-tight flex items-center gap-3">
          <Mail className="w-8 h-8" />
          Email Dispatch Live Tester
        </h1>
        <p className="text-sm font-bold text-[#121212]/80 mt-1">
          Directly test email sending, check Google account connection, and verify live email delivery to any inbox.
        </p>
      </div>

      {/* Connection Status Card */}
      <Card className="bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#121212]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border-2 border-[#121212] ${
                googleStatus?.connected ? "bg-[#00E676] text-[#121212]" : "bg-[#FF5252] text-white"
              }`}
            >
              {googleStatus?.connected ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-[#121212]">
                  {googleStatus?.connected ? "Gmail Connected" : "Gmail Not Connected"}
                </h3>
                {googleStatus?.connected && (
                  <Badge variant={googleStatus.isDemo ? "yellow" : "mint"}>
                    {googleStatus.isDemo
                      ? "Simulator / Demo"
                      : (googleStatus as any)?.isSmtp
                      ? "Live Gmail SMTP"
                      : "Live Google API"}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-mono text-[#71717A]">
                {googleStatus?.connected ? (
                  <>Sender: <strong className="text-[#121212]">{googleStatus.email}</strong></>
                ) : (
                  "No Gmail account currently linked to HackTrack"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStatus}
              disabled={isLoadingStatus}
              title="Refresh connection status"
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
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Real Mode Note */}
        {googleStatus?.connected && !googleStatus.isDemo && (
          <div className="p-3 bg-[#00E676]/10 border-2 border-[#00E676] rounded-xl text-xs font-medium text-[#121212] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00E676] shrink-0" />
            <span>
              Real Gmail dispatch is active! Emails sent from HackTrack will be delivered directly from <strong>{googleStatus.email}</strong> to real inboxes.
            </span>
          </div>
        )}
      </Card>

      {/* Interactive Send Form */}
      <Card className="bg-white p-6 space-y-6">
        <div>
          <h2 className="text-xl font-black text-[#121212] tracking-tight">
            Send Live Test Email
          </h2>
          <p className="text-xs text-[#71717A] font-medium mt-0.5">
            Fill in the recipient email address below to send an immediate test email.
          </p>
        </div>

        {!googleStatus?.connected && !isLoadingStatus && (
          <div className="p-5 bg-[#FFEB3B] border-3 border-[#121212] rounded-xl shadow-brutal-sm space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#121212] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-sm text-[#121212]">
                  Connect Your Gmail Account (2 Ways to Proceed)
                </h4>
                <p className="text-xs font-bold text-[#121212]/80 mt-1">
                  Choose how you want to connect <strong>mujahidchoudhry37@gmail.com</strong>:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Option A: Direct 1-Click */}
              <div className="p-3 bg-white border-2 border-[#121212] rounded-lg space-y-2 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 bg-[#00E676] text-[#121212] text-[10px] font-mono font-bold uppercase rounded mb-1">
                    Instant (Recommended)
                  </span>
                  <h5 className="font-black text-xs text-[#121212]">
                    Connect mujahidchoudhry37@gmail.com Directly
                  </h5>
                  <p className="text-[11px] text-[#71717A] mt-0.5 font-medium leading-tight">
                    Instantly links this address without having to configure Google Cloud OAuth or fix redirect URIs.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleConnectDirectly("mujahidchoudhry37@gmail.com")}
                  className="w-full gap-1.5 font-black text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Use mujahidchoudhry37@gmail.com
                </Button>
              </div>

              {/* Option B: Fix Google Cloud Redirect URI */}
              <div className="p-3 bg-white border-2 border-[#121212] rounded-lg space-y-2 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 bg-[#2196F3] text-white text-[10px] font-mono font-bold uppercase rounded mb-1">
                    Full Google API
                  </span>
                  <h5 className="font-black text-xs text-[#121212]">
                    Fix Redirect URI & Use Live OAuth
                  </h5>
                  <p className="text-[11px] text-[#71717A] mt-0.5 font-medium leading-tight">
                    Add <code className="bg-neutral-100 px-1 py-0.5 rounded text-[10px]">http://localhost:3000/api/auth/google/callback</code> to Authorized redirect URIs in Google Cloud Console.
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
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#121212] mb-1.5">
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
            <p className="text-[11px] text-[#71717A] mt-1 font-medium">
              Enter the email address where you want to receive the test broadcast.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#121212] mb-1.5">
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
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#121212] mb-1.5">
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
            className={`p-5 rounded-xl border-3 border-[#121212] shadow-brutal-sm space-y-2 ${
              sendResult.success ? "bg-[#00E676]/15" : "bg-[#FF5252]/15"
            }`}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#121212]" />
              <h4 className="font-mono font-black text-sm uppercase text-[#121212]">
                {sendResult.success ? "✓ Dispatch Succeeded" : "✕ Dispatch Failed"}
              </h4>
            </div>

            {sendResult.success ? (
              <div className="text-xs font-mono space-y-1.5 text-[#121212]">
                <p>
                  <strong>Delivery Mode:</strong>{" "}
                  {sendResult.isDemo ? (
                    <span className="text-[#E65100] font-black">LOCAL SIMULATOR (No internet email sent)</span>
                  ) : (
                    <span className="text-[#00C853] font-black">REAL OUTGOING DELIVERY (Google Mail Servers)</span>
                  )}
                </p>
                <p>
                  <strong>Message ID:</strong> {sendResult.messageId}
                </p>
                <p>
                  <strong>Timestamp:</strong> {sendResult.timestamp}
                </p>
                {sendResult.isDemo ? (
                  <div className="p-2.5 bg-[#FFEB3B] border-2 border-[#121212] rounded-lg text-xs font-bold text-[#121212] mt-2">
                    ⚠️ Note: This was a simulated test dispatch. The email was logged in your console/database, but Google mail servers did NOT deliver it across the internet because no live credentials (App Password or Google OAuth) have been authorized yet.
                  </div>
                ) : (
                  <p className="text-[#00C853] font-bold mt-2">
                    👉 Delivered! Check your inbox at <strong>{toEmail}</strong> (also check the Spam / Updates tab if not in Primary).
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs font-mono space-y-2 text-[#121212]">
                <p>
                  <strong>Error Message:</strong>
                </p>
                <div className="p-3 bg-white rounded-lg border-2 border-[#121212] text-[#FF1744] font-mono break-all whitespace-pre-wrap">
                  {sendResult.error}
                </div>
                <p className="text-[#71717A] mt-2">
                  Tip: If Gmail is not connected, click <strong>Connect Google Account</strong> above or in Settings to authenticate your Gmail.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
