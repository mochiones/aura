import { NextResponse } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { createEntry } from "@/lib/entries/service";
import { getDayEntry } from "@/lib/entries/service";
import { askTherapist } from "@/lib/therapist/ask";

// SDK MCP używa Node API (crypto itd.) — wymuszamy runtime Node.
export const runtime = "nodejs";
export const maxDuration = 30;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Pakuje dowolny wynik w tekstową odpowiedź narzędzia MCP. */
function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

/** Odpowiedź błędu narzędzia (widoczna dla agenta). */
function fail(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

/**
 * Buduje świeży serwer MCP dla danego użytkownika. Narzędzia domykają `userId`,
 * więc każde żądanie działa per-user (jak reszta API). Reużywa serwisów
 * (createEntry / getDayEntry / askTherapist) — jedno źródło logiki z API.
 */
function buildServer(userId: string | null): McpServer {
  const server = new McpServer({
    name: "aura-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "create_entry",
    {
      title: "Dodaj wpis",
      description:
        "Dodaje nowy wpis do dziennika. Domyślnie na dziś; opcjonalnie z oceną nastroju 1–5.",
      inputSchema: {
        content: z.string().describe("Treść wpisu (tekst)."),
        mood: z
          .number()
          .int()
          .min(1)
          .max(5)
          .nullish()
          .describe("Ocena nastroju 1–5 (opcjonalna)."),
        date: z
          .string()
          .regex(ISO_DATE)
          .optional()
          .describe("Dzień wpisu YYYY-MM-DD (domyślnie dziś)."),
      },
    },
    async ({ content, mood, date }) => {
      try {
        const entry = await createEntry({ content, mood, date }, userId);
        return ok(entry);
      } catch (err) {
        return fail(err instanceof Error ? err.message : "Failed to create entry");
      }
    }
  );

  server.registerTool(
    "ask_therapist",
    {
      title: "Zapytaj psychoterapeutę",
      description:
        "Zadaje pytanie cyfrowemu terapeucie (Freud). Domyślnie w kontekście dzisiejszego dnia; opcjonalnie wskaż inny dzień. Zwraca odpowiedź tekstową.",
      inputSchema: {
        question: z.string().describe("Pytanie do agenta."),
        day: z
          .string()
          .regex(ISO_DATE)
          .optional()
          .describe("Dzień jako kontekst YYYY-MM-DD (domyślnie dziś)."),
      },
    },
    async ({ question, day }) => {
      try {
        const result = await askTherapist({ question, day, userId });
        return ok(result);
      } catch (err) {
        return fail(err instanceof Error ? err.message : "Agent request failed");
      }
    }
  );

  server.registerTool(
    "get_day_entry",
    {
      title: "Wpis na dzień",
      description:
        "Zwraca informację, czy na dany dzień jest wpis (najnowszy) wraz z jego treścią i nastrojem.",
      inputSchema: {
        date: z
          .string()
          .regex(ISO_DATE)
          .describe("Dzień YYYY-MM-DD."),
      },
    },
    async ({ date }) => {
      try {
        const result = await getDayEntry(date, userId);
        return ok(result);
      } catch (err) {
        return fail(err instanceof Error ? err.message : "Failed to load entry");
      }
    }
  );

  return server;
}

/**
 * Obsługa MCP przez Streamable HTTP (transport web-standardowy). Tryb bezstanowy:
 * nowy serwer + transport na każde żądanie, odpowiedzi jako JSON (enableJsonResponse).
 */
async function handle(req: Request): Promise<Response> {
  const auth = await authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const server = buildServer(auth.userId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // bezstanowo
    enableJsonResponse: true,
  });

  await server.connect(transport);
  return transport.handleRequest(req);
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
