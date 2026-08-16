import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  TherapistSession,
  SessionSummary,
  PersonaId,
} from "@/types/therapist";
import type {
  SessionRepository,
  AppendMessageInput,
} from "./session-repository";

const DATA_PATH = path.join(process.cwd(), "data", "therapist-sessions.json");

// Prosty zamek, by sekwencyjne zapisy (user → assistant) nie nadpisywały się nawzajem.
let writeChain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.catch(() => {});
  return next;
}

async function readFile(): Promise<TherapistSession[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as { sessions: TherapistSession[] };
    return parsed.sessions;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      await fs.writeFile(DATA_PATH, JSON.stringify({ sessions: [] }), "utf-8");
      return [];
    }
    console.error("[Aura] Failed to read therapist-sessions.json:", err);
    throw new Error("DATA_CORRUPTED");
  }
}

async function writeFile(sessions: TherapistSession[]): Promise<void> {
  await fs.writeFile(
    DATA_PATH,
    JSON.stringify({ sessions }, null, 2),
    "utf-8"
  );
}

function titleFrom(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

class JsonSessionRepository implements SessionRepository {
  async listSummaries(): Promise<SessionSummary[]> {
    const sessions = await readFile();
    return sessions
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .map(({ messages, ...rest }) => ({
        ...rest,
        messageCount: messages.length,
      }));
  }

  async getById(id: string): Promise<TherapistSession | null> {
    const sessions = await readFile();
    return sessions.find((s) => s.id === id) ?? null;
  }

  async appendMessage(
    sessionId: string,
    persona: PersonaId,
    message: AppendMessageInput
  ): Promise<TherapistSession> {
    return serialize(async () => {
      const sessions = await readFile();
      const now = new Date().toISOString();
      let session = sessions.find((s) => s.id === sessionId);

      if (!session) {
        session = {
          id: sessionId,
          persona,
          title: null,
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        sessions.push(session);
      }

      session.messages.push({
        id: uuidv4(),
        role: message.role,
        content: message.content,
        createdAt: now,
      });
      session.updatedAt = now;

      // Tytuł z pierwszej wiadomości użytkownika.
      if (!session.title && message.role === "user") {
        session.title = titleFrom(message.content);
      }

      await writeFile(sessions);
      return session;
    });
  }

  async delete(id: string): Promise<void> {
    return serialize(async () => {
      const sessions = await readFile();
      const idx = sessions.findIndex((s) => s.id === id);
      if (idx === -1) return;
      sessions.splice(idx, 1);
      await writeFile(sessions);
    });
  }
}

export const sessionRepository: SessionRepository = new JsonSessionRepository();
