import { NextRequest, NextResponse } from "next/server";
import { entryRepository } from "@/lib/repository/json-entry-repository";
import { authenticate, isValidIsoDate } from "@/lib/api-auth";
import type { Mood, NewEntry } from "@/types/entry";

/** Body akceptowane przez endpoint dodawania wpisu (API sterujące). */
interface CreateEntryBody extends Partial<NewEntry> {
  /** Dzień wpisu YYYY-MM-DD. Domyślnie dziś. */
  date?: string;
}

function isValidMood(value: unknown): value is Mood {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export async function GET(req: NextRequest) {
  const auth = authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Tryb user → tylko wpisy właściciela; tryb local (userId=null) → tylko
    // wpisy współdzielone (userId===null). Izolacja: bez tokenu nie widać cudzych.
    const entries = await entryRepository.getAll(auth.userId);
    return NextResponse.json(entries);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "DATA_CORRUPTED") {
      return NextResponse.json({ error: "DATA_CORRUPTED" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as CreateEntryBody;

    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Nastrój jest opcjonalny; jeśli podany, musi być liczbą całkowitą 1–5.
    let mood: Mood | null = null;
    if (body.mood !== undefined && body.mood !== null) {
      if (!isValidMood(body.mood)) {
        return NextResponse.json(
          { error: "Mood must be an integer between 1 and 5" },
          { status: 400 }
        );
      }
      mood = body.mood;
    }

    // Dzień wpisu: domyślnie dziś; można nadpisać przez `date` (YYYY-MM-DD).
    let createdAt: string | undefined;
    let day = new Date().toISOString().slice(0, 10);
    if (body.date !== undefined) {
      if (!isValidIsoDate(body.date)) {
        return NextResponse.json(
          { error: "Date must be in YYYY-MM-DD format" },
          { status: 400 }
        );
      }
      day = body.date;
      // Południe UTC — unika przesunięcia dnia przy konwersji stref czasowych.
      createdAt = `${body.date}T12:00:00.000Z`;
    }

    const title = body.title?.trim() || `Wpis z dnia ${day}`;

    const entry = await entryRepository.create(
      {
        title,
        content: body.content,
        tags: body.tags ?? [],
        mood,
      },
      { userId: auth.userId, createdAt }
    );

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
