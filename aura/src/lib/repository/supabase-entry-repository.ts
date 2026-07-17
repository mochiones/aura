import type { SupabaseClient } from "@supabase/supabase-js";
import type { Entry, Mood, NewEntry } from "@/types/entry";
import type { EntryRepository } from "./entry-repository";

// Wiersz w tabeli public.entries (kolumny w snake_case).
interface EntryRow {
  id: string;
  title: string;
  content: string;
  tags: string[];
  mood: number | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags ?? [],
    mood: (row.mood as Mood | null) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

// Fabryka repozytorium powiązanego z sesją konkretnego użytkownika.
// RLS (owner = auth.uid()) automatycznie ogranicza dostęp do własnych wpisów;
// user_id przy tworzeniu ustawiamy jawnie na id zalogowanego usera.
export function createSupabaseEntryRepository(
  supabase: SupabaseClient,
  userId: string
): EntryRepository {
  return {
    async getAll(): Promise<Entry[]> {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data as EntryRow[]).map(rowToEntry);
    },

    async getById(id: string): Promise<Entry | null> {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? rowToEntry(data as EntryRow) : null;
    },

    async create(data: NewEntry): Promise<Entry> {
      const { data: row, error } = await supabase
        .from("entries")
        .insert({
          title: data.title,
          content: data.content,
          tags: data.tags,
          mood: data.mood,
          user_id: userId,
          // Bez createdAt bazowy default ustawia „teraz".
          ...(data.createdAt ? { created_at: data.createdAt } : {}),
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return rowToEntry(row as EntryRow);
    },

    async update(id: string, data: Partial<NewEntry>): Promise<Entry> {
      // updated_at aktualizuje trigger w bazie danych.
      const patch: Record<string, unknown> = {};
      if (data.title !== undefined) patch.title = data.title;
      if (data.content !== undefined) patch.content = data.content;
      if (data.tags !== undefined) patch.tags = data.tags;
      if (data.mood !== undefined) patch.mood = data.mood;

      const { data: rows, error } = await supabase
        .from("entries")
        .update(patch)
        .eq("id", id)
        .select("*");
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) throw new Error("NOT_FOUND");
      return rowToEntry(rows[0] as EntryRow);
    },

    async delete(id: string): Promise<void> {
      const { data: rows, error } = await supabase
        .from("entries")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) throw new Error("NOT_FOUND");
    },
  };
}
