import { getGoogleStatusAction } from "@/actions/google";
import { GoogleConnectCard } from "@/components/GoogleConnectCard";
import { Shield, Key, Mail, Terminal } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const account = await getGoogleStatusAction();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b-3 border-[#121212]">
        <h1 className="text-3xl font-black text-[#121212] tracking-tight">
          System Settings & Integrations
        </h1>
        <p className="text-sm font-bold text-[#71717A] mt-1">
          Manage your email dispatch credentials, Google OAuth tokens, and system health.
        </p>
      </div>

      {/* Gmail OAuth Integration Card */}
      <GoogleConnectCard initialAccount={account} />

      {/* Background Scheduler Status Information */}
      <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-[#121212]">
          <div className="p-2 bg-[#2196F3] text-white rounded-lg border-2 border-[#121212]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-[#121212]">
              Background Worker & Cron Architecture
            </h3>
            <p className="text-xs font-bold text-[#71717A]">
              Independent scheduled broadcast dispatching daemon
            </p>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 border-2 border-[#121212] rounded-xl space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#71717A]">Worker Polling Interval:</span>
            <strong className="text-[#121212]">15 Seconds</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#71717A]">Worker Script:</span>
            <strong className="text-[#121212]">npm run worker</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#71717A]">Cron Webhook Endpoint:</span>
            <strong className="text-[#121212]">/api/cron/process</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#71717A]">OAuth Token Refresh:</span>
            <strong className="text-[#00E676]">Automatic via googleapis</strong>
          </div>
        </div>

        <p className="text-xs text-[#71717A] font-medium leading-relaxed">
          The background worker checks MySQL for messages with status <code>SCHEDULED</code> whose target delivery timestamp has arrived. It transitions the status to <code>SENDING</code>, requests a refreshed token if needed, dispatches MIME-encoded emails to each participant, and logs individual <code>SENT</code> or <code>FAILED</code> statuses.
        </p>
      </div>

      {/* Google Cloud Setup Instructions Accordion/Box */}
      <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-[#121212]">
          <div className="p-2 bg-[#FFEB3B] text-[#121212] rounded-lg border-2 border-[#121212]">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-[#121212]">
              Google Cloud Console Configuration
            </h3>
            <p className="text-xs font-bold text-[#71717A]">
              Required credentials to link your own Google Project
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed font-medium text-[#121212]">
          <p>
            To enable Gmail OAuth sending, make sure your <code>.env</code> file has:
          </p>
          <pre className="p-3 bg-neutral-100 border-2 border-[#121212] rounded-lg font-mono text-[11px] overflow-x-auto">
{`GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"`}
          </pre>
          <ol className="list-decimal pl-5 space-y-1.5 text-[#71717A] font-sans">
            <li>
              Go to{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-[#121212]"
              >
                Google Cloud Console
              </a>
              .
            </li>
            <li>Enable the <strong>Gmail API</strong> and <strong>Google OAuth2 API</strong>.</li>
            <li>Configure OAuth Consent Screen and add the <code>https://www.googleapis.com/auth/gmail.send</code> scope.</li>
            <li>
              Create an OAuth 2.0 Client ID (Web Application) and add Authorized Redirect URI:{" "}
              <code className="font-mono text-[#121212]">http://localhost:3000/api/auth/google/callback</code>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
