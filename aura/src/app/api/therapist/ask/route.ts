import { NextResponse } from "next/server";
import { createXai } from "@ai-sdk/xai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { entryRepository } from "@/lib/repository/json-entry-repository";
import { getPersona, type PersonaId } from "@/lib/therapist/persona";
import {
  formatEntryFull,
  formatEntryBrief,
  buildMoodSummary,
} from "@/lib/therapist/entry-context";
import { authenticate, isValidIsoDate } from "@/lib/api-auth";

export const maxDuration = 30;

// Provider xAI (Grok) — patrz /api/therapist/chat. Tu wariant BEZ streamu:
// jedno pytanie → jedna kompletna odpowiedź w JSON (do sterowania programistycznego).
const xai = createXai({ apiKey: process.env.XAI_API_KEY });
const MODEL_ID = "grok-4-1-fast-non-reasoning";

interface AskBody {
  /** Pytanie do agenta. */
  question?: string;
  /** Opcjonalny dzień (YYYY-MM-DD) jako kontekst — "spójrz na ten dzień". */
  day?: string;
  persona?: PersonaId;
}

export async function POST(req: Request) {
  const auth = authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.XAI_API_KEY) {
    return NextResponse.json({ error: "Brak klucza XAI_API_KEY" }, { status: 500 });
  }

  const { question, day, persona: personaId }: AskBody = await req.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }
  if (day !== undefined && !isValidIsoDate(day)) {
    return NextResponse.json(
      { error: "Day must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const persona = getPersona(personaId);
  // Skopiowanie po użytkowniku: tryb user → jego wpisy; local (null) → tylko
  // wpisy współdzielone (userId===null). Agent nie widzi cudzych bez tokenu.
  const scope = auth.userId;

  // Kontekst dnia: domyślnie DZIŚ (tak jakby użytkownik miał otwarty dzisiejszy
  // dzień), a `day` nadpisuje na inny dzień. Doklejamy do promptu id najnowszego
  // wpisu z tego dnia (analogicznie do openDayEntryId w czacie), by model wiedział,
  // "na który dzień patrzy" i sięgnął po niego narzędziem getEntry.
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

  try {
    const { text } = await generateText({
      model: xai(MODEL_ID),
      system,
      prompt: question,
      tools,
      stopWhen: stepCountIs(5),
    });

    return NextResponse.json({ answer: text, persona: persona.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    console.error("[Aura] /api/therapist/ask error:", message);
    return NextResponse.json({ error: "Agent request failed" }, { status: 500 });
  }
}
