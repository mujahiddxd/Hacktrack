export type MessageStatus =
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "CANCELLED"
  | (string & {});

export type RecipientStatus = "PENDING" | "SENT" | "FAILED" | (string & {});

export interface ParticipantType {
  id: string;
  hackathonId: string;
  name: string;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MessageRecipientType {
  id: string;
  scheduledMessageId: string;
  participantId: string;
  status: RecipientStatus;
  sentAt?: Date | string | null;
  errorMessage?: string | null;
  participant?: ParticipantType;
}

export interface ScheduledMessageType {
  id: string;
  hackathonId: string;
  subject: string;
  message: string;
  scheduledAt: Date | string;
  status: MessageStatus;
  sentAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  recipients?: MessageRecipientType[];
  _count?: {
    recipients: number;
  };
}

export interface HackathonType {
  id: string;
  name: string;
  description: string;
  roundDetails?: string | null;
  hackathonDate: Date | string;
  registrationDeadline: Date | string;
  fee: string;
  location: string;
  registrationLink?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  participants?: ParticipantType[];
  scheduledMessages?: ScheduledMessageType[];
  _count?: {
    participants: number;
    scheduledMessages: number;
  };
}

export interface DashboardMetrics {
  totalHackathons: number;
  upcomingHackathonsCount: number;
  totalParticipants: number;
  scheduledMessagesCount: number;
  sentMessagesCount: number;
}
