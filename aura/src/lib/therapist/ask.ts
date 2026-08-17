/**
 * Serwis agenta (Freud) — wariant non-streaming, wspólny dla API i MCP.
 * Jedno pytanie → jedna kompletna odpowiedź tekstowa. Model sam sięga po
 * narzędzia (getEntry/listEntries/getMoodSummary), skopiowane po userId.
 */
import { createXai } from "@ai-sdk/xai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { entryRepository } from "@/lib/repository/entries";
import { getPersona, type PersonaId } from "@/lib/therapist/persona";
import {
  formatEntryFull,
  formatEntryBrief,
  buildMoodSummary,
} from "@/lib/therapist/entry-context";
import { isValidIsoDate } from "@/lib/api-auth";
import { ValidationError, ConfigError } from "@/lib/errors";

// Provider xAI (Grok). API OpenAI-compatible; @ai-sdk/xai celuje w https://api.x.ai/v1.
const xai = createXai({ apiKey: process.env.XAI_API_KEY });
const MODEL_ID = "grok-4-1-fast-non-reasoning";

export interface AskInput {
  question?: string;
  /** Opcjonalny dzień (YYYY-MM-DD) jako kontekst. Domyślnie dziś. */
  day?: string;
  persona?: PersonaId;
  /** Właściciel (string) lub null (tryb lokalny — tylko wpisy współdzielone). */
  userId: string | null;
}

export interface AskResult {
  answer: string;
  persona: PersonaId;
}

export async function askTherapist({
  question,
  day,
  persona: personaId,
  userId,
}: AskInput): Promise<AskResult> {
  if (!process.env.XAI_API_KEY) {
    throw new ConfigError("Brak klucza XAI_API_KEY");
  }
  if (!question?.trim()) {
    throw new ValidationError("Question is required");
  }
  if (day !== undefined && !isValidIsoDate(day)) {
    throw new ValidationError("Day must be in YYYY-MM-DD format");
  }

  const persona = getPersona(personaId);
  const scope = userId;

  // Kontekst dnia: domyślnie DZIŚ; `day` nadpisuje na inny dzień.
  const today = new Date().toISOString().slice(0, 10);
  const contextDay = day ?? today;
  const isToday = contextDay === today;
  const dayLabel = isToday ? `${contextDay} (dziś)` : contextDay;

  let system = persona.systemPrompt;
  const entries = await entryRepository.getAll(scope);
  const dayEntry = entries.find((e) => e.createdAt.slice(0, 10) === contextDay);
  if (dayEntry) {
    system += `\n\n# Aktualnie wskazany dzień\nUżytkownik pyta w kontekście dnia ${dayLabel} (wpis o id "${dayEntry.id}", tytuł: "${dayEntry.title}"). Jeśli pytanie dotyczy "tego dnia", użyj getEntry z tym id.`;
  } else {
    system += `\n\n# Aktualnie wskazany dzień\nUżytkownik pyta w kontekście dnia ${dayLabel}, ale nie ma jeszcze wpisu z tego dnia. Powiedz to łagodnie, jeśli to istotne, i możesz sięgnąć po szerszy kontekst (listEntries / getMoodSummary).`;
  }

  const tools = {
    getEntry: tool({
      description:
        "Pobiera pełną treść jednego wpisu dziennika po jego id. Użyj do analizy konkretnego dnia.",
      inputSchema: z.object({
        id: z.string().describe("Identyfikator wpisu do pobrania."),
      }),
      execute: async ({ id }) => {
        const entry = await entryRepository.getById(id, scope);
        if (!entry) return { found: false as const };
        return { found: true as const, entry: formatEntryFull(entry) };
      },
    }),

    listEntries: tool({
      description:
        "Zwraca skrótową listę ostatnich wpisów (data, nastrój, tytuł, fragment). Użyj przy pytaniach ogólnych o wiele dni.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(60)
          .default(30)
          .describe("Ile ostatnich wpisów zwrócić (domyślnie 30)."),
      }),
      execute: async ({ limit }) => {
        const all = await entryRepository.getAll(scope);
        const slice = all.slice(0, limit);
        return {
          count: slice.length,
          entries: slice.map((e) => formatEntryBrief(e)),
        };
      },
    }),

    getMoodSummary: tool({
      description:
        "Zwraca agregaty nastroju z całej historii (średnia, rozkład 1–5, zakres dat, częste tagi). Tanie spojrzenie na trendy — użyj przy pytaniach o zmiany nastroju w czasie.",
      inputSchema: z.object({}),
      execute: async () => {
        const all = await entryRepository.getAll(scope);
        return buildMoodSummary(all);
      },
    }),
  };

  const { text } = await generateText({
    model: xai(MODEL_ID),
    system,
    prompt: question,
    tools,
    stopWhen: stepCountIs(5),
  });

  return { answer: text, persona: persona.id };
}
