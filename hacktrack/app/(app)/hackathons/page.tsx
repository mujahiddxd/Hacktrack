import Link from "next/link";
import { getHackathons } from "@/actions/hackathons";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import { Plus, Calendar, Users, Send, MapPin, Clock, ArrowRight, Sparkles, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex shrink-0 items-center gap-1.5 font-bold text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right font-bold text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

export default async function HackathonsPage() {
  const hackathons = await getHackathons();

  return (
    <PageShell>
      <PageHeader
        icon={Trophy}
        eyebrow={`${hackathons.length} active`}
        title="Hackathons"
        description="Create, manage, and broadcast to hackathon participants."
        actions={
          <>
            <Link href="/ai-add" className={buttonVariants({ variant: "outline" })}>
              <Sparkles className="h-4 w-4" />
              Import with AI
            </Link>
            <Link href="/hackathons/new" className={buttonVariants({ className: "font-black" })}>
              <Plus className="h-4 w-4" />
              Create Hackathon
            </Link>
          </>
        }
      />

      {hackathons.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink bg-surface p-10 text-center sm:p-12">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-muted" />
          <h2 className="text-xl font-black text-ink">No hackathons yet</h2>
          <p className="mx-auto mt-2 mb-6 max-w-md text-sm text-muted">
            Get started by creating your first hackathon with event dates, location, and round details.
          </p>
          <Link href="/hackathons/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            Create First Hackathon
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {hackathons.map((hackathon) => {
            const isUpcoming = new Date(hackathon.hackathonDate) >= new Date();

            return (
              <article
                key={hackathon.id}
                className="brutal-card flex flex-col justify-between rounded-2xl bg-surface p-5 transition-transform hover:-translate-y-1 sm:p-6"
              >
                <div className="min-w-0">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge variant={isUpcoming ? "yellow" : "outline"}>{isUpcoming ? "Upcoming" : "Past Event"}</Badge>
                    <Badge variant="blue" className="max-w-[50%] truncate font-mono">
                      {hackathon.fee}
                    </Badge>
                  </div>

                  <h2 className="mb-2 line-clamp-1 text-xl font-black tracking-tight text-ink">
                    <Link href={`/hackathons/${hackathon.id}`} className="hover:underline">
                      {hackathon.name}
                    </Link>
                  </h2>

                  <p className="mb-4 line-clamp-3 text-sm font-medium leading-relaxed text-body">{hackathon.description}</p>

                  <dl className="space-y-2 border-t-2 border-ink pt-4 font-mono text-xs">
                    <MetaRow icon={Calendar} label="Event" value={formatDate(hackathon.hackathonDate)} />
                    <MetaRow icon={Clock} label="Deadline" value={formatDate(hackathon.registrationDeadline)} />
                    <MetaRow icon={MapPin} label="Location" value={hackathon.location} />
                  </dl>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-ink pt-5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink">
                    <span
                      className="flex items-center gap-1 rounded border border-ink bg-[#00E676]/20 px-2 py-0.5"
                      title="Participants"
                    >
                      <Users className="h-3 w-3" />
                      {hackathon._count?.participants || 0}
                    </span>
                    <span
                      className="flex items-center gap-1 rounded border border-ink bg-[#2196F3]/20 px-2 py-0.5"
                      title="Scheduled messages"
                    >
                      <Send className="h-3 w-3" />
                      {hackathon._count?.scheduledMessages || 0}
                    </span>
                  </div>

                  <Link href={`/hackathons/${hackathon.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Manage
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
