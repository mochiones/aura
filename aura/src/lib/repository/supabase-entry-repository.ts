import { supabaseRest } from "@/lib/supabase";
import type { Entry, Mood, NewEntry } from "@/types/entry";
import type {
  CreateOptions,
  EntryRepository,
  MatchSource,
  MutateOptions,
  SearchOptions,
  SearchResultEntry,
} from "./entry-repository";

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
  // PostgREST zwraca pgvector jako tekstową reprezentację "[0.01,0.02,...]".
  embedding: string | null;
}

/** Wiersz zwracany przez RPC hybrid_search_entries (bez kolumny embedding). */
interface SearchRow {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  mood: number | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  match_source: MatchSource;
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
    embedding: r.embedding ? (JSON.parse(r.embedding) as number[]) : null,
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
      embedding: data.embedding ?? null,
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

  async update(id: string, data: Partial<NewEntry>, opts?: MutateOptions): Promise<Entry> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.content !== undefined) patch.content = data.content;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.mood !== undefined) patch.mood = data.mood;
    if (data.embedding !== undefined) patch.embedding = data.embedding;

    // Z accessTokenem RLS sam odrzuci cudzy wiersz — bez niego (tokeny API/MCP,
    // brak prawdziwego JWT) filtrujemy jawnie po właścicielu w zapytaniu.
    const filter = opts?.accessToken ? "" : userFilter(opts?.userId);
    const res = await supabaseRest(
      `entries?id=eq.${encodeURIComponent(id)}${filter}&select=*`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(patch),
      },
      opts?.accessToken
    );
    if (!res.ok) await fail("UPDATE", res);
    const rows = (await res.json()) as Row[];
    if (rows.length === 0) throw new Error("NOT_FOUND");
    return toEntry(rows[0]);
  }

  async delete(id: string, opts?: MutateOptions): Promise<void> {
    const filter = opts?.accessToken ? "" : userFilter(opts?.userId);
    const res = await supabaseRest(
      `entries?id=eq.${encodeURIComponent(id)}${filter}&select=id`,
      { method: "DELETE", headers: { Prefer: "return=representation" } },
      opts?.accessToken
    );
    if (!res.ok) await fail("DELETE", res);
    const rows = (await res.json()) as { id: string }[];
    if (rows.length === 0) throw new Error("NOT_FOUND");
  }

  async search({
    userId,
    queryText,
    queryEmbedding,
    recentDays = 7,
  }: SearchOptions): Promise<SearchResultEntry[]> {
    const res = await supabaseRest("rpc/hybrid_search_entries", {
      method: "POST",
      body: JSON.stringify({
        p_user_id: userId,
        p_query_text: queryText,
        p_query_embedding: queryEmbedding,
        p_recent_days: recentDays,
      }),
    });
    if (!res.ok) await fail("SEARCH", res);
    const rows = (await res.json()) as SearchRow[];
    return rows.map((r) => ({
      ...toEntry({ ...r, embedding: null }),
      matchSource: r.match_source,
    }));
  }
}

export const supabaseEntryRepository: EntryRepository =
  new SupabaseEntryRepository();
