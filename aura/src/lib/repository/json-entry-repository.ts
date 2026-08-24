import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { Entry, NewEntry } from "@/types/entry";
import type { CreateOptions, EntryRepository, MutateOptions } from "./entry-repository";

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
}

export const entryRepository: EntryRepository = new JsonEntryRepository();
