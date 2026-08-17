/**
 * Minimalny klient Supabase przez REST (PostgREST) na `fetch` — bez zależności
 * `@supabase/supabase-js`. Działa na Vercelu (serverless, tylko fetch).
 *
 * Używa KLUCZA SECRET (server-only) → omija RLS. NIGDY nie wołać z klienta.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

/** Czy mamy komplet konfiguracji Supabase (URL + klucz secret). */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET);
}

/** Wywołanie PostgREST. `path` np. `api_tokens?select=id`. */
export async function supabaseRest(
  path: string,
  init?: RequestInit
): Promise<Response> {
  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    throw new Error("Supabase not configured");
  }
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SECRET,
      Authorization: `Bearer ${SUPABASE_SECRET}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
}
