import type {
  TherapistSession,
  SessionSummary,
  ChatRole,
  PersonaId,
} from "@/types/therapist";

export interface AppendMessageInput {
  role: ChatRole;
  content: string;
}

/**
 * Warstwa trwałości rozmów z terapeutą. Dziś JSON (Faza 1), docelowo Supabase —
 * bez zmian w API endpointów. Analogicznie do [[entry-repository]].
 */
export interface SessionRepository {
  /** Lista sesji (bez treści wiadomości), najnowsze pierwsze. */
  listSummaries(): Promise<SessionSummary[]>;
  /** Pełna sesja z wiadomościami albo null. */
  getById(id: string): Promise<TherapistSession | null>;
  /**
   * Dopisuje wiadomość do sesji; tworzy sesję, jeśli nie istnieje.
   * Tytuł ustawiany automatycznie z pierwszej wiadomości użytkownika.
   */
  appendMessage(
    sessionId: string,
    persona: PersonaId,
    message: AppendMessageInput
  ): Promise<TherapistSession>;
  /** Usuwa sesję. */
  delete(id: string): Promise<void>;
}
