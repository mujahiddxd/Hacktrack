import Link from "next/link";
import { getHackathons } from "@/actions/hackathons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Calendar,
  Users,
  Send,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HackathonsPage() {
  const hackathons = await getHackathons();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-[#121212]">
        <div>
          <h1 className="text-3xl font-black text-[#121212] tracking-tight">
            Hackathons Directory
          </h1>
          <p className="text-sm font-bold text-[#71717A] mt-1">
            Create, manage, and broadcast to hackathon participants ({hackathons.length} active)
          </p>
        </div>
        <Link href="/hackathons/new">
          <Button variant="primary" size="lg" className="gap-2 font-black">
            <Plus className="w-5 h-5" />
            Create Hackathon
          </Button>
        </Link>
      </div>

      {/* Grid */}
      {hackathons.length === 0 ? (
        <div className="brutal-card p-12 text-center rounded-2xl bg-white">
          <Calendar className="w-12 h-12 text-[#71717A] mx-auto mb-3" />
          <h3 className="font-black text-xl text-[#121212]">
            No Hackathons Created Yet
          </h3>
          <p className="text-sm text-[#71717A] max-w-md mx-auto mt-2 mb-6">
            Get started by creating your first hackathon with event dates, location, and round details.
          </p>
          <Link href="/hackathons/new">
            <Button variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Hackathon
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => {
            const isUpcoming = new Date(hackathon.hackathonDate) >= new Date();

            return (
              <div
                key={hackathon.id}
                className="brutal-card rounded-2xl p-6 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={isUpcoming ? "yellow" : "outline"}>
                      {isUpcoming ? "Upcoming" : "Past Event"}
                    </Badge>
                    <Badge variant="blue" className="font-mono">
                      {hackathon.fee}
                    </Badge>
                  </div>

                  <h2 className="text-xl font-black text-[#121212] tracking-tight mb-2 line-clamp-1">
                    {hackathon.name}
                  </h2>

                  <p className="text-xs text-[#71717A] font-medium line-clamp-3 mb-4">
                    {hackathon.description}
                  </p>

                  <div className="space-y-2 pt-4 border-t-2 border-[#121212] text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5" /> Event Date:
                      </span>
                      <strong className="text-[#121212]">
                        {formatDate(hackathon.hackathonDate)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5" /> Reg. Deadline:
                      </span>
                      <strong className="text-[#121212]">
                        {formatDate(hackathon.registrationDeadline)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] flex items-center gap-1.5 font-bold">
                        <MapPin className="w-3.5 h-3.5" /> Location:
                      </span>
                      <strong className="text-[#121212]">{hackathon.location}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t-2 border-[#121212] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs font-mono font-bold text-[#121212]">
                    <span className="flex items-center gap-1 bg-[#00E676]/20 px-2 py-0.5 border border-[#121212] rounded">
                      <Users className="w-3 h-3 text-[#121212]" />
                      {hackathon._count?.participants || 0}
                    </span>
                    <span className="flex items-center gap-1 bg-[#2196F3]/20 px-2 py-0.5 border border-[#121212] rounded">
                      <Send className="w-3 h-3 text-[#121212]" />
                      {hackathon._count?.scheduledMessages || 0}
                    </span>
                  </div>

                  <Link href={`/hackathons/${hackathon.id}`}>
                    <Button variant="outline" size="sm" className="gap-1 font-bold">
                      Manage
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
