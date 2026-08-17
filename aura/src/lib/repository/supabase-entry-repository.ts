import { supabaseRest } from "@/lib/supabase";
import type { Entry, Mood, NewEntry } from "@/types/entry";
import type { CreateOptions, EntryRepository } from "./entry-repository";

/** Wiersz z tabeli public.entries (snake_case). */
interface Row {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  mood: number | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

function toEntry(r: Row): Entry {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    tags: r.tags ?? [],
    mood: (r.mood as Mood | null) ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    userId: r.user_id,
  };
}

/** Filtr właściciela dla PostgREST: undefined=wszyscy, null=IS NULL, string=eq. */
function userFilter(userId?: string | null): string {
  if (userId === undefined) return "";
  return userId === null
    ? "&user_id=is.null"
    : `&user_id=eq.${encodeURIComponent(userId)}`;
}

async function fail(op: string, res: Response): Promise<never> {
  let body = "";
  try {
    body = (await res.text()).slice(0, 200);
  } catch {
    /* ignore */
  }
  throw new Error(`SUPABASE_ENTRY_${op}_FAILED ${res.status} ${body}`);
}

/** EntryRepository na Supabase (PostgREST). Mapuje snake_case ↔ camelCase. */
class SupabaseEntryRepository implements EntryRepository {
  async getAll(userId?: string | null): Promise<Entry[]> {
    const res = await supabaseRest(
      `entries?select=*&order=created_at.desc${userFilter(userId)}`
    );
    if (!res.ok) await fail("LIST", res);
    const rows = (await res.json()) as Row[];
    return rows.map(toEntry);
  }

  async getById(id: string, userId?: string | null): Promise<Entry | null> {
    const res = await supabaseRest(
      `entries?select=*&id=eq.${encodeURIComponent(id)}${userFilter(
        userId
      )}&limit=1`
    );
    if (!res.ok) await fail("GET", res);
    const rows = (await res.json()) as Row[];
    return rows[0] ? toEntry(rows[0]) : null;
  }

  async create(data: NewEntry, opts?: CreateOptions): Promise<Entry> {
    const insert: Record<string, unknown> = {
      title: data.title,
      content: data.content,
      tags: data.tags,
      mood: data.mood,
      user_id: opts?.userId ?? null,
    };
    if (opts?.createdAt) insert.created_at = opts.createdAt;

    const res = await supabaseRest("entries?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(insert),
    });
    if (!res.ok) await fail("CREATE", res);
    const [created] = (await res.json()) as Row[];
    return toEntry(created);
  }

  async update(id: string, data: Partial<NewEntry>): Promise<Entry> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.content !== undefined) patch.content = data.content;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.mood !== undefined) patch.mood = data.mood;

    const res = await supabaseRest(
      `entries?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(patch),
      }
    );
    if (!res.ok) await fail("UPDATE", res);
    const rows = (await res.json()) as Row[];
    if (rows.length === 0) throw new Error("NOT_FOUND");
    return toEntry(rows[0]);
  }

  async delete(id: string): Promise<void> {
    const res = await supabaseRest(
      `entries?id=eq.${encodeURIComponent(id)}&select=id`,
      { method: "DELETE", headers: { Prefer: "return=representation" } }
    );
    if (!res.ok) await fail("DELETE", res);
    const rows = (await res.json()) as { id: string }[];
    if (rows.length === 0) throw new Error("NOT_FOUND");
  }
}

export const supabaseEntryRepository: EntryRepository =
  new SupabaseEntryRepository();
