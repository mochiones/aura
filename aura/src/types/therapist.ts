import type { PersonaId } from "@/lib/therapist/persona";

export type { PersonaId };

export type ChatRole = "user" | "assistant";

export interface StoredMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO 8601
}

export interface TherapistSession {
  id: string;
  persona: PersonaId;
  title: string | null; // auto z pierwszej wiadomości użytkownika
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

/** Sesja bez wiadomości — do listy historii. */
export type SessionSummary = Omit<TherapistSession, "messages"> & {
  messageCount: number;
};
