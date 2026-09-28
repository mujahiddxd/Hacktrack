import Link from "next/link";
import { notFound } from "next/navigation";
import { getHackathonById } from "@/actions/hackathons";
import { EditHackathonForm } from "@/components/EditHackathonForm";
import { ArrowLeft } from "lucide-react";

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/hackathons/${hackathon.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {hackathon.name}
        </Link>
      </div>

      <EditHackathonForm hackathon={hackathon as any} />
    </div>
  );
}
