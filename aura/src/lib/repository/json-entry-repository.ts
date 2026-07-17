import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { Entry, NewEntry } from "@/types/entry";
import type { EntryRepository } from "./entry-repository";

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
  async getAll(): Promise<Entry[]> {
    const entries = await readFile();
    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<Entry | null> {
    const entries = await readFile();
    return entries.find((e) => e.id === id) ?? null;
  }

  async create(data: NewEntry): Promise<Entry> {
    const entries = await readFile();
    const now = new Date().toISOString();
    const entry: Entry = {
      id: uuidv4(),
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: now,
      userId: null,
    };
    entries.push(entry);
    await writeFile(entries);
    return entry;
  }

  async update(id: string, data: Partial<NewEntry>): Promise<Entry> {
    const entries = await readFile();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("NOT_FOUND");
    const updated: Entry = {
      ...entries[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    entries[idx] = updated;
    await writeFile(entries);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const entries = await readFile();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("NOT_FOUND");
    entries.splice(idx, 1);
    await writeFile(entries);
  }
}

export const entryRepository: EntryRepository = new JsonEntryRepository();
