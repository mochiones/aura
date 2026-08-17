/**
 * Minimalny klient Supabase przez REST (PostgREST) na `fetch` — bez zależności
 * `@supabase/supabase-js`. Działa na Vercelu (serverless, tylko fetch).
 *
 * Używa KLUCZA SECRET (server-only) → omija RLS. NIGDY nie wołać z klienta.
 */

// Normalizacja: usuwamy białe znaki i końcowe ukośniki (typowe błędy przy wklejaniu
// wartości do panelu Vercela). URL może być pod NEXT_PUBLIC_ lub bez prefiksu.
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  ""
)
  .trim()
  .replace(/\/+$/, "");
const SUPABASE_SECRET = (process.env.SUPABASE_SECRET_KEY ?? "").trim();

/** Czy mamy komplet konfiguracji Supabase (URL + klucz secret). */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET);
}

/**
 * Diagnostyka obecności zmiennych (tylko booleany, bez wartości/sekretów).
 * `npUrl` = NEXT_PUBLIC_SUPABASE_URL (wpalane przy buildzie), `url` = SUPABASE_URL
 * (runtime), `secret` = SUPABASE_SECRET_KEY (runtime).
 */
export function supabaseEnvStatus() {
  return {
    npUrl: Boolean((process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()),
    url: Boolean((process.env.SUPABASE_URL ?? "").trim()),
    secret: Boolean((process.env.SUPABASE_SECRET_KEY ?? "").trim()),
    configured: isSupabaseConfigured(),
  };
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
