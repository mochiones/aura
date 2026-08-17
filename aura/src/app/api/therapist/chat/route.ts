import { NextResponse } from "next/server";
import { createXai } from "@ai-sdk/xai";
import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { entryRepository } from "@/lib/repository/entries";
import { sessionRepository } from "@/lib/therapist/json-session-repository";
import { getPersona, type PersonaId } from "@/lib/therapist/persona";
import { getOwnerUserId } from "@/lib/owner";
import {
  formatEntryFull,
  formatEntryBrief,
  buildMoodSummary,
} from "@/lib/therapist/entry-context";

export const maxDuration = 30;

/** Wyciąga czysty tekst z części wiadomości UIMessage. */
function textOf(message: UIMessage | undefined): string {
  if (!message) return "";
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("")
    .trim();
}

// Provider xAI (Grok). API jest OpenAI-compatible; @ai-sdk/xai celuje w https://api.x.ai/v1.
const xai = createXai({ apiKey: process.env.XAI_API_KEY });

// Domyślny wariant modelu: non-reasoning (szybkie odpowiedzi). Patrz PRD §4.
const MODEL_ID = "grok-4-1-fast-non-reasoning";

interface ChatBody {
  messages: UIMessage[];
  /** Id sesji (rozmowy) — do trwałej historii. */
  sessionId?: string;
  /** Id aktualnie otwartego dnia (jeśli użytkownik wszedł z widoku wpisu). */
  openDayEntryId?: string;
  persona?: PersonaId;
}

export async function POST(req: Request) {
  if (!process.env.XAI_API_KEY) {
    return NextResponse.json(
      { error: "Brak klucza XAI_API_KEY" },
      { status: 500 }
    );
  }

  const { messages, sessionId, openDayEntryId, persona: personaId }: ChatBody =
    await req.json();
  const persona = getPersona(personaId);
  // Faza 1: jeden użytkownik — skopuj czytanie wpisów do ownera (Supabase ma
  // dane wielu userów; bez tego Freud widziałby cudze wpisy).
  const scope = getOwnerUserId();

  // Trwała historia: zapisz ostatnią wiadomość użytkownika przed streamowaniem.
  if (sessionId) {
    const userText = textOf(messages[messages.length - 1]);
    if (userText) {
      await sessionRepository.appendMessage(sessionId, persona.id, {
        role: "user",
        content: userText,
      });
    }
  }

  // Kontekst aktywnego dnia doklejamy do promptu systemowego, żeby model
  // wiedział, "na który dzień patrzy" użytkownik (auto-dobór kontekstu — PRD §6.2).
  let system = persona.systemPrompt;
  if (openDayEntryId) {
    const openEntry = await entryRepository.getById(openDayEntryId, scope);
    if (openEntry) {
      system += `\n\n# Aktualnie otwarty dzień\nUżytkownik ma teraz otwarty wpis o id "${openEntry.id}" z dnia ${openEntry.createdAt.slice(
        0,
        10
      )} (tytuł: "${openEntry.title}"). Jeśli pytanie dotyczy "tego dnia", użyj getEntry z tym id.`;
    }
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
        const all = await entryRepository.getAll(scope); // posortowane malejąco po dacie
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

  const result = streamText({
    model: xai(MODEL_ID),
    system,
    messages: await convertToModelMessages(messages),
    tools,
    // Pozwól modelowi wywołać narzędzia i dokończyć odpowiedź w kolejnych krokach.
    stopWhen: stepCountIs(5),
    // Trwała historia: zapisz odpowiedź Freuda po zakończeniu streamu.
    onFinish: async ({ text }) => {
      if (sessionId && text.trim()) {
        await sessionRepository.appendMessage(sessionId, persona.id, {
          role: "assistant",
          content: text,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
