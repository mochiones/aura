import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseEntryRepository } from "@/lib/repository/supabase-entry-repository";
import type { NewEntry } from "@/types/entry";

// Buduje repozytorium powiązane z zalogowanym użytkownikiem albo zwraca null (401).
async function getRepo() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return createSupabaseEntryRepository(supabase, user.id);
}

export async function GET() {
  const repo = await getRepo();
  if (!repo) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const entries = await repo.getAll();
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const repo = await getRepo();
  if (!repo) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Partial<NewEntry>;

    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    let createdAt: string | undefined;
    if (body.createdAt !== undefined) {
      const parsed = Date.parse(body.createdAt);
      if (Number.isNaN(parsed) || parsed > Date.now()) {
        return NextResponse.json(
          { error: "createdAt must be a valid past date" },
          { status: 400 }
        );
      }
      createdAt = new Date(parsed).toISOString();
    }

    const entry = await repo.create({
      title: body.title.trim(),
      content: body.content,
      tags: body.tags ?? [],
      mood: body.mood ?? null,
      createdAt,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
