import { NextRequest, NextResponse } from "next/server";
import { entryRepository } from "@/lib/repository/json-entry-repository";
import type { NewEntry } from "@/types/entry";

export async function GET() {
  try {
    const entries = await entryRepository.getAll();
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
  try {
    const body = (await req.json()) as Partial<NewEntry>;

    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const entry = await entryRepository.create({
      title: body.title.trim(),
      content: body.content,
      tags: body.tags ?? [],
      mood: body.mood ?? null,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
