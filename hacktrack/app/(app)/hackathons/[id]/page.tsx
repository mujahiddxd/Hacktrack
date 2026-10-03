import Link from "next/link";
import { notFound } from "next/navigation";
import { getHackathonById } from "@/actions/hackathons";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ParticipantManager } from "@/components/ParticipantManager";
import { MessageScheduler } from "@/components/MessageScheduler";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Edit3,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HackathonDetailPage({ params }: Props) {
  const { id } = await params;
  const hackathon = await getHackathonById(id);

  if (!hackathon) {
    notFound();
  }

  const isUpcoming = new Date(hackathon.hackathonDate) >= new Date();

  const meta = [
    { icon: Calendar, label: "Event date", value: formatDate(hackathon.hackathonDate), tone: "bg-[#FFEB3B] text-on-accent" },
    { icon: Clock, label: "Registration deadline", value: formatDate(hackathon.registrationDeadline), tone: "bg-[#2196F3] text-white" },
    { icon: MapPin, label: "Location", value: hackathon.location, tone: "bg-[#00E676] text-on-accent" },
  ];

  return (
    <PageShell>
      <PageHeader
        backHref="/hackathons"
        backLabel="All hackathons"
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2 normal-case tracking-normal">
            <Badge variant={isUpcoming ? "yellow" : "outline"}>{isUpcoming ? "● Upcoming" : "Past event"}</Badge>
            <Badge variant="blue" className="font-mono">
              Fee: {hackathon.fee}
            </Badge>
          </span>
        }
        title={hackathon.name}
        description={hackathon.description}
        actions={
          <>
            {hackathon.registrationLink && (
              <a
                href={hackathon.registrationLink}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Public link
              </a>
            )}
            <Link href={`/hackathons/${hackathon.id}/edit`} className={buttonVariants({ size: "sm" })}>
              <Edit3 className="h-3.5 w-3.5" />
              Edit hackathon
            </Link>
          </>
        }
      />

      {/* Key facts */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {meta.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="flex min-w-0 items-center gap-3 rounded-xl border-2 border-ink bg-surface p-4 shadow-brutal-sm">
            <div className={`shrink-0 rounded-lg border-2 border-ink p-2 ${tone}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">{label}</dt>
              <dd className="truncate text-sm font-black text-ink" title={value}>
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {hackathon.roundDetails && (
        <section className="brutal-card rounded-2xl bg-surface p-5 sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-ink">
            <Award className="h-4 w-4 text-[#FF5252]" />
            Rounds &amp; milestones
          </h2>
          <div className="whitespace-pre-line rounded-xl border-2 border-ink bg-canvas p-4 text-sm font-medium leading-relaxed text-ink">
            {hackathon.roundDetails}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 sm:gap-8 2xl:grid-cols-2 2xl:items-start">
        <ParticipantManager hackathonId={hackathon.id} initialParticipants={hackathon.participants} />
        <MessageScheduler
          hackathonId={hackathon.id}
          hackathonName={hackathon.name}
          participants={hackathon.participants}
          initialMessages={hackathon.scheduledMessages}
        />
      </div>
    </PageShell>
  );
}
