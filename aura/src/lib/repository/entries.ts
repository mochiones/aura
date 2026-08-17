/**
 * Wybór magazynu wpisów: Supabase (jeśli skonfigurowane) albo JSON (lokalny dev).
 * Vercel ma tylko-do-odczytu FS → zapis do data/entries.json tam pada, więc gdy
 * są klucze Supabase, używamy Supabase (działa na Vercelu).
 */
import { isSupabaseConfigured } from "@/lib/supabase";
import type { EntryRepository } from "./entry-repository";
import { entryRepository as jsonEntryRepository } from "./json-entry-repository";
import { supabaseEntryRepository } from "./supabase-entry-repository";

export const entryRepository: EntryRepository = isSupabaseConfigured()
  ? supabaseEntryRepository
  : jsonEntryRepository;
