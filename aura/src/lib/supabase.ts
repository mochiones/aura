/**
 * Minimalny klient Supabase przez REST (PostgREST) na `fetch` — bez zależności
 * `@supabase/supabase-js`. Działa na Vercelu (serverless, tylko fetch).
 *
 * Domyślnie używa KLUCZA SECRET (server-only) → omija RLS. NIGDY nie wołać
 * bez `accessToken` z klienta. Gdy podasz `accessToken` (prawdziwy token
 * sesji Supabase zalogowanego użytkownika), żądanie leci jako TEN użytkownik
 * (klucz anon + jego JWT) — wtedy Postgres liczy `auth.uid()` i RLS realnie
 * filtruje wiersze. To celowa dwutorowość: klienci programistyczni (tokeny
 * API/MCP) nie mają prawdziwego JWT, więc zostają na kluczu secret z
 * jawnym filtrem po userId w warstwie repozytorium.
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
const SUPABASE_ANON_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  ""
).trim();

/** Czy mamy komplet konfiguracji Supabase (URL + klucz secret). */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET);
}

/**
 * Wywołanie PostgREST. `path` np. `api_tokens?select=id`.
 * `accessToken` — gdy podany, żądanie idzie jako ten użytkownik (klucz anon
 * + jego JWT), więc RLS faktycznie się stosuje; bez niego — klucz secret.
 */
export async function supabaseRest(
  path: string,
  init?: RequestInit,
  accessToken?: string
): Promise<Response> {
  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    throw new Error("Supabase not configured");
  }
  const apikey = accessToken ? SUPABASE_ANON_KEY : SUPABASE_SECRET;
  const authorization = `Bearer ${accessToken ?? SUPABASE_SECRET}`;
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey,
      Authorization: authorization,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
}
