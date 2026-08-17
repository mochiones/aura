/**
 * Wybór magazynu tokenów: Supabase (jeśli skonfigurowane) albo JSON (lokalny dev).
 *
 * Vercel ma tylko-do-odczytu system plików → zapis do data/tokens.json tam pada.
 * Dlatego gdy są klucze Supabase, używamy Supabase (działa na Vercelu).
 */
import { isSupabaseConfigured } from "@/lib/supabase";
import type { TokenRepository } from "./token-repository";
import { tokenRepository as jsonTokenRepository } from "./json-token-repository";
import { supabaseTokenRepository } from "./supabase-token-repository";

export const tokenRepository: TokenRepository = isSupabaseConfigured()
  ? supabaseTokenRepository
  : jsonTokenRepository;
