/**
 * Serwis wpisów — wspólna logika dla API (route handlers) i MCP.
 * Jedno źródło prawdy dla walidacji i domyślnych wartości (bez dryfu).
 */
import { entryRepository } from "@/lib/repository/entries";
import { isValidIsoDate } from "@/lib/api-auth";
import { ValidationError } from "@/lib/errors";
import { stripHtml } from "@/lib/therapist/entry-context";
import { computeEmbedding } from "@/lib/embeddings";
import type { Entry, Mood } from "@/types/entry";

export interface CreateEntryInput {
  content?: string;
  mood?: number | null;
  date?: string;
  title?: string;
  tags?: string[];
}

function isValidMood(value: unknown): value is Mood {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

/** Tworzy wpis: content wymagany, mood 1–5 opcjonalny, data domyślnie dziś. */
export async function createEntry(
  input: CreateEntryInput,
  userId: string | null
): Promise<Entry> {
  if (!input.content?.trim()) {
    throw new ValidationError("Content is required");
  }

  let mood: Mood | null = null;
  if (input.mood !== undefined && input.mood !== null) {
    if (!isValidMood(input.mood)) {
      throw new ValidationError("Mood must be an integer between 1 and 5");
    }
    mood = input.mood;
  }

  // Dzień wpisu: domyślnie dziś; `date` nadpisuje (południe UTC — anty-przesunięcie stref).
  let createdAt: string | undefined;
  let day = new Date().toISOString().slice(0, 10);
  if (input.date !== undefined) {
    if (!isValidIsoDate(input.date)) {
      throw new ValidationError("Date must be in YYYY-MM-DD format");
    }
    day = input.date;
    createdAt = `${input.date}T12:00:00.000Z`;
  }

  const title = input.title?.trim() || `Wpis z dnia ${day}`;

  let embedding: number[] | null = null;
  try {
    embedding = await computeEmbedding(stripHtml(input.content));
  } catch (err) {
    console.warn("[Aura] Nie udało się policzyć embeddingu:", err);
  }

  return entryRepository.create(
    { title, content: input.content, tags: input.tags ?? [], mood, embedding },
    { userId, createdAt }
  );
}

export interface DayEntryResult {
  date: string;
  exists: boolean;
  entry: Entry | null;
}

/** Zwraca najnowszy wpis z danego dnia (lub exists:false), skopiowany po userId. */
export async function getDayEntry(
  date: string,
  userId: string | null
): Promise<DayEntryResult> {
  if (!isValidIsoDate(date)) {
    throw new ValidationError("Date must be in YYYY-MM-DD format");
  }
  // getAll posortowane malejąco → pierwszy pasujący po dacie = najnowszy.
  const entries = await entryRepository.getAll(userId);
  const entry = entries.find((e) => e.createdAt.slice(0, 10) === date) ?? null;
  return { date, exists: entry !== null, entry };
}
