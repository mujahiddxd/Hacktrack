import { getGoogleStatusAction } from "@/actions/google";
import { GoogleConnectCard } from "@/components/GoogleConnectCard";
import { Key, Settings, Terminal } from "lucide-react";
import { PageHeader, PageShell, SectionHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const account = await getGoogleStatusAction();

  return (
    <PageShell width="default">
      <PageHeader
        icon={Settings}
        title="Settings & Integrations"
        description="Connect the Gmail account your broadcasts are sent from."
      />

      {/* Gmail OAuth Integration Card */}
      <GoogleConnectCard initialAccount={account} />

      <div className="space-y-4">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">Developer setup</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Background Scheduler Status Information */}
          <section className="brutal-card rounded-2xl p-5 sm:p-6 bg-surface space-y-4">
            <SectionHeader
              className="mb-0"
              icon={Terminal}
              iconClassName="bg-[#2196F3] text-white"
              title="Background worker & cron"
              subtitle="How scheduled broadcasts get dispatched"
            />

            <div className="p-4 bg-quiet border-2 border-ink rounded-xl space-y-2 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-x-3">
                <span className="text-muted">Worker Polling Interval:</span>
                <strong className="text-ink">15 Seconds</strong>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3">
                <span className="text-muted">Worker Script:</span>
                <strong className="text-ink">npm run worker</strong>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3">
                <span className="text-muted">Cron Webhook Endpoint:</span>
                <strong className="text-ink">/api/cron/process</strong>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3">
                <span className="text-muted">OAuth Token Refresh:</span>
                <strong className="text-[#00E676]">Automatic via googleapis</strong>
              </div>
            </div>

            <p className="text-xs text-muted font-medium leading-relaxed">
              The background worker checks MySQL for messages with status <code>SCHEDULED</code> whose target delivery timestamp has arrived. It transitions the status to <code>SENDING</code>, requests a refreshed token if needed, dispatches MIME-encoded emails to each participant, and logs individual <code>SENT</code> or <code>FAILED</code> statuses.
            </p>
          </section>

          {/* Google Cloud Setup Instructions */}
          <section className="brutal-card rounded-2xl p-5 sm:p-6 bg-surface space-y-4">
            <SectionHeader
              className="mb-0"
              icon={Key}
              title="Google Cloud configuration"
              subtitle="Credentials for Google sign-in and Gmail sending"
            />

            <div className="space-y-3 text-xs leading-relaxed font-medium text-ink">
              <p>
                To enable Gmail OAuth sending, make sure your <code>.env</code> file has:
              </p>
              <pre className="p-3 bg-quiet border-2 border-ink rounded-lg font-mono text-[11px] overflow-x-auto">
    {`GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="your-client-secret"
    GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"`}
              </pre>
              <ol className="list-decimal pl-5 space-y-1.5 text-muted font-sans">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold text-ink"
                  >
                    Google Cloud Console
                  </a>
                  .
                </li>
                <li>Enable the <strong>Gmail API</strong> and <strong>Google OAuth2 API</strong>.</li>
                <li>Configure OAuth Consent Screen and add the <code>https://www.googleapis.com/auth/gmail.send</code> scope.</li>
                <li>
                  Create an OAuth 2.0 Client ID (Web Application) and add Authorized Redirect URI:{" "}
                  <code className="break-all font-mono text-ink">http://localhost:3000/api/auth/google/callback</code>
                </li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
