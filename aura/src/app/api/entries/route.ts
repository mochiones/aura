import { NextRequest, NextResponse } from "next/server";
import { entryRepository } from "@/lib/repository/json-entry-repository";
import { authenticate } from "@/lib/api-auth";
import { createEntry, type CreateEntryInput } from "@/lib/entries/service";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
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
  const auth = await authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as CreateEntryInput;
    const entry = await createEntry(body, auth.userId);
    return NextResponse.json(entry, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
