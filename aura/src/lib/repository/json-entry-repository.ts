import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { Entry, NewEntry } from "@/types/entry";
import { stripHtml } from "@/lib/therapist/entry-context";
import type {
  CreateOptions,
  EntryRepository,
  MatchSource,
  MutateOptions,
  SearchOptions,
  SearchResultEntry,
} from "./entry-repository";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

const DATA_PATH = path.join(process.cwd(), "data", "entries.json");

async function readFile(): Promise<Entry[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as { entries: Entry[] };
    return parsed.entries;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      await fs.writeFile(DATA_PATH, JSON.stringify({ entries: [] }), "utf-8");
      return [];
    }
    console.error("[Aura] Failed to read entries.json:", err);
    throw new Error("DATA_CORRUPTED");
  }
}

async function writeFile(entries: Entry[]): Promise<void> {
  await fs.writeFile(
    DATA_PATH,
    JSON.stringify({ entries }, null, 2),
    "utf-8"
  );
}

class JsonEntryRepository implements EntryRepository {
  async getAll(userId?: string | null): Promise<Entry[]> {
    const entries = await readFile();
    const scoped =
      userId === undefined ? entries : entries.filter((e) => e.userId === userId);
    return scoped.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string, userId?: string | null): Promise<Entry | null> {
    const entries = await readFile();
    const entry = entries.find((e) => e.id === id) ?? null;
    if (!entry) return null;
    if (userId !== undefined && entry.userId !== userId) return null;
    return entry;
  }

  async create(data: NewEntry, opts?: CreateOptions): Promise<Entry> {
    const entries = await readFile();
    const now = new Date().toISOString();
    const entry: Entry = {
      id: uuidv4(),
      ...data,
      embedding: data.embedding ?? null,
      createdAt: opts?.createdAt ?? now,
      updatedAt: now,
      userId: opts?.userId ?? null,
    };
    entries.push(entry);
    await writeFile(entries);
    return entry;
  }

  async update(id: string, data: Partial<NewEntry>, opts?: MutateOptions): Promise<Entry> {
    const entries = await readFile();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("NOT_FOUND");
    if (opts?.userId !== undefined && entries[idx].userId !== opts.userId) {
      throw new Error("NOT_FOUND");
    }
    const updated: Entry = {
      ...entries[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    entries[idx] = updated;
    await writeFile(entries);
    return updated;
  }

  async delete(id: string, opts?: MutateOptions): Promise<void> {
    const entries = await readFile();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("NOT_FOUND");
    if (opts?.userId !== undefined && entries[idx].userId !== opts.userId) {
      throw new Error("NOT_FOUND");
    }
    entries.splice(idx, 1);
    await writeFile(entries);
  }

  /**
   * Fallback dev/offline dla hybrid search: substring match zamiast FTS,
   * ręczna cosine similarity zamiast pgvector, plus wpisy z ostatnich dni.
   */
  async search({
    userId,
    queryText,
    queryEmbedding,
    recentDays = 7,
  }: SearchOptions): Promise<SearchResultEntry[]> {
    const all = (await this.getAll(userId)).filter((e) => e.userId === userId);
    const q = queryText.toLowerCase();

    const ftsMatches = all
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          stripHtml(e.content).toLowerCase().includes(q)
      )
      .slice(0, 30);

    const vectorMatches = queryEmbedding
      ? all
          .filter((e): e is Entry & { embedding: number[] } => e.embedding !== null)
          .map((e) => ({ entry: e, score: cosineSimilarity(e.embedding, queryEmbedding) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 30)
          .map((x) => x.entry)
      : [];

    const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
    const recentMatches = all.filter((e) => new Date(e.createdAt).getTime() >= cutoff);

    const byId = new Map<string, SearchResultEntry>();
    const buckets: [MatchSource, Entry[]][] = [
      ["vector", vectorMatches],
      ["fts", ftsMatches],
      ["recent", recentMatches],
    ];
    for (const [source, list] of buckets) {
      for (const e of list) {
        if (!byId.has(e.id)) byId.set(e.id, { ...e, matchSource: source });
      }
    }
    return [...byId.values()];
  }
}

export const entryRepository: EntryRepository = new JsonEntryRepository();
