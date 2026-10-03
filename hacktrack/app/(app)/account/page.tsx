import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import { AccountSettings, AccountSummary } from "@/components/AccountSettings";
import { PageHeader, PageShell } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <PageShell width="default">
      <PageHeader
        icon={UserRound}
        eyebrow="Settings"
        title="My Account"
        description="Manage your profile, password, sign-in methods and account."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr] lg:items-start lg:gap-8">
        <AccountSummary user={user} />
        <AccountSettings user={user} />
      </div>
    </PageShell>
  );
}
