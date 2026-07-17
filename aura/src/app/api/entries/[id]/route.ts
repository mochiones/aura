import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseEntryRepository } from "@/lib/repository/supabase-entry-repository";
import type { NewEntry } from "@/types/entry";

type Params = { params: Promise<{ id: string }> };

// Buduje repozytorium powiązane z zalogowanym użytkownikiem albo zwraca null (401).
async function getRepo() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return createSupabaseEntryRepository(supabase, user.id);
}

export async function GET(_req: NextRequest, { params }: Params) {
  const repo = await getRepo();
  if (!repo) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const entry = await repo.getById(id);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed to load entry" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const repo = await getRepo();
  if (!repo) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<NewEntry>;
    const entry = await repo.update(id, body);
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
  const repo = await getRepo();
  if (!repo) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await repo.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
