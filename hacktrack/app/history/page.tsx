import { getHistoryHackathons } from "@/actions/hackathons";
import HistoryContent from "@/components/HistoryContent";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const rawHackathons = await getHistoryHackathons();

  // Safely serialize Date objects for client component consumption
  const initialHackathons = JSON.parse(JSON.stringify(rawHackathons));

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <HistoryContent initialHackathons={initialHackathons} />
    </div>
  );
}
