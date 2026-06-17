import type { Entry, NewEntry } from "@/types/entry";

export interface EntryRepository {
  getAll(): Promise<Entry[]>;
  getById(id: string): Promise<Entry | null>;
  create(data: NewEntry): Promise<Entry>;
  update(id: string, data: Partial<NewEntry>): Promise<Entry>;
  delete(id: string): Promise<void>;
}
