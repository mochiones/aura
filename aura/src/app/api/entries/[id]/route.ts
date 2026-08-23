import { NextRequest, NextResponse } from "next/server";
import { entryRepository } from "@/lib/repository/entries";
import { getOwnerUserId } from "@/lib/owner";
import { stripHtml } from "@/lib/therapist/entry-context";
import { computeEmbedding } from "@/lib/embeddings";
import type { NewEntry } from "@/types/entry";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    // Faza 1: jeden użytkownik — czytamy tylko wpisy ownera.
    const entry = await entryRepository.getById(id, getOwnerUserId());
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed to load entry" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<NewEntry>;
    // Nigdy nie ufaj embeddingowi z requestu — zawsze liczony server-side.
    const { embedding: _ignored, ...patch } = body;
    if (patch.content !== undefined) {
      try {
        (patch as Partial<NewEntry>).embedding = await computeEmbedding(
          stripHtml(patch.content)
        );
      } catch (err) {
        console.warn("[Aura] Nie udało się przeliczyć embeddingu po edycji:", err);
      }
    }
    const entry = await entryRepository.update(id, patch);
    return NextResponse.json(entry);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await entryRepository.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
