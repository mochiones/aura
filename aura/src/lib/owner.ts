/**
 * Id "właściciela" danych w Fazie 1 (jeden użytkownik, brak logowania).
 * Do czasu Fazy 2 = SUPABASE_OWNER_ID. Generowane tokeny są skopiowane do niego
 * — spójnie z istniejącym tokenem z AURA_API_TOKENS.
 *
 * Tylko po stronie serwera (czyta zmienną bez prefiksu NEXT_PUBLIC_).
 */
export function getOwnerUserId(): string {
  return process.env.SUPABASE_OWNER_ID ?? "local-owner";
}
