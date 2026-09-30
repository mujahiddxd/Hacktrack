import Link from "next/link";
import { notFound } from "next/navigation";
import { getHackathonById } from "@/actions/hackathons";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
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

  return (
    <div className="space-y-8">
      {/* Navigation back */}
      <div>
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Hackathons
        </Link>
      </div>

      {/* Main Hackathon Header Card */}
      <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isUpcoming ? "yellow" : "outline"}>
                {isUpcoming ? "● Upcoming" : "Past Event"}
              </Badge>
              <Badge variant="blue" className="font-mono">
                Fee: {hackathon.fee}
              </Badge>
              {/* Subtle coding doodle in whitespace */}
              <span className="font-mono text-xs font-bold text-[#121212]/30 select-none tracking-widest pl-1">
                &lt;/&gt;
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121212] tracking-tight leading-[1.1]">
              {hackathon.name}
            </h1>

            <p className="text-sm font-medium text-[#71717A] max-w-2xl">
              {hackathon.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hackathon.registrationLink && (
              <a
                href={hackathon.registrationLink}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5 font-bold">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Public Link
                </Button>
              </a>
            )}

            <Link href={`/hackathons/${hackathon.id}/edit`}>
              <Button variant="primary" size="sm" className="gap-1.5 font-bold">
                <Edit3 className="w-3.5 h-3.5" />
                Edit Hackathon
              </Button>
            </Link>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t-2 border-[#121212]">
          <div className="p-3 bg-[#FEFDF8] border-2 border-[#121212] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-[#FFEB3B] rounded-lg border border-[#121212]">
              <Calendar className="w-4 h-4 text-[#121212]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">
                Event Date
              </span>
              <strong className="text-sm text-[#121212] font-mono">
                {formatDate(hackathon.hackathonDate)}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-[#FEFDF8] border-2 border-[#121212] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-[#2196F3] rounded-lg border border-[#121212] text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">
                Registration Deadline
              </span>
              <strong className="text-sm text-[#121212] font-mono">
                {formatDate(hackathon.registrationDeadline)}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-[#FEFDF8] border-2 border-[#121212] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-[#00E676] rounded-lg border border-[#121212] text-[#121212]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">
                Location
              </span>
              <strong className="text-sm text-[#121212] truncate block">
                {hackathon.location}
              </strong>
            </div>
          </div>
        </div>

        {/* Round Details Section */}
        {hackathon.roundDetails && (
          <div className="pt-4 border-t-2 border-[#121212]">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#FF5252]" />
                Round Milestones & Guidelines
              </h4>
              <span className="font-mono text-xs font-bold text-[#121212]/25 select-none tracking-widest pl-1">&#123; &#125;</span>
            </div>
            <div className="p-4 bg-neutral-50 border-2 border-[#121212] rounded-xl text-xs font-medium text-[#121212] whitespace-pre-line leading-relaxed">
              {hackathon.roundDetails}
            </div>
          </div>
        )}
      </div>

      {/* Participant Management Hub */}
      <ParticipantManager
        hackathonId={hackathon.id}
        initialParticipants={hackathon.participants}
      />

      {/* Scheduled Broadcast Hub & Delivery Tracking */}
      <MessageScheduler
        hackathonId={hackathon.id}
        hackathonName={hackathon.name}
        participants={hackathon.participants}
        initialMessages={hackathon.scheduledMessages as any}
      />
    </div>
  );
}
