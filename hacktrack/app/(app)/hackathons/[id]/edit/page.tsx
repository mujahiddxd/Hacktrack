import { notFound } from "next/navigation";
import { getHackathonById } from "@/actions/hackathons";
import { EditHackathonForm } from "@/components/EditHackathonForm";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { Edit } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditHackathonPage({ params }: Props) {
  const { id } = await params;
  const hackathon = await getHackathonById(id);

  if (!hackathon) {
    notFound();
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        backHref={`/hackathons/${hackathon.id}`}
        backLabel={`Back to ${hackathon.name}`}
        icon={Edit}
        eyebrow="Edit hackathon"
        title={hackathon.name}
        description="Update dates, location, or round requirements."
      />
      <EditHackathonForm hackathon={hackathon} />
    </PageShell>
  );
}
