import { getDashboardData } from "@/actions/hackathons";
import { getGoogleStatusAction } from "@/actions/google";
import { getCurrentUser } from "@/actions/auth";
import DashboardContent from "@/components/DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ allHackathons, scheduledMessagesCount, sentMessagesCount }, googleAccount, user] =
    await Promise.all([getDashboardData(), getGoogleStatusAction(), getCurrentUser()]);

  return (
    <DashboardContent
      allHackathons={JSON.parse(JSON.stringify(allHackathons))}
      scheduledMessagesCount={scheduledMessagesCount}
      sentMessagesCount={sentMessagesCount}
      googleAccount={googleAccount}
      userName={user?.name}
    />
  );
}
