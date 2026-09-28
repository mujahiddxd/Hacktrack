import { getDashboardData } from "@/actions/hackathons";
import { getGoogleStatusAction } from "@/actions/google";
import DashboardContent from "@/components/DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ allHackathons, scheduledMessagesCount, sentMessagesCount }, googleAccount] =
    await Promise.all([getDashboardData(), getGoogleStatusAction()]);

  return (
    <DashboardContent
      allHackathons={JSON.parse(JSON.stringify(allHackathons))}
      scheduledMessagesCount={scheduledMessagesCount}
      sentMessagesCount={sentMessagesCount}
      googleAccount={googleAccount}
    />
  );
}
