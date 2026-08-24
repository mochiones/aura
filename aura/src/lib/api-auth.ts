/**
 * Autoryzacja żądań (API kontrolne, MCP i wewnętrzne trasy web UI).
 *
 * Tożsamość ustalamy dwutorowo:
 *   1) Nagłówek `Authorization: Bearer <token>` — STATYCZNA MAPA token → userId
 *      z env `AURA_API_TOKENS` (JSON; wstecz), albo token wygenerowany w
 *      panelu /docs (hash w TokenRepository). Do klientów programistycznych
 *      (curl, MCP) — to nie są prawdziwe JWT Supabase.
 *   2) Brak nagłówka → realna sesja Supabase odczytana z ciasteczek żądania
 *      (przeglądarka, po zalogowaniu). Ważna sesja → tryb "user" z prawdziwym
 *      `auth.uid()` i tokenem dostępu (do zapytań respektujących RLS).
 * Nigdy nie commitujemy jawnych tokenów (env w `.env.local`, w magazynie tylko hash).
 *
 * Model użycia w trasach:
 *   - Token poprawny LUB ważna sesja → tryb "user".
 *   - Token obecny, ale nieznany → tryb "invalid" (trasa zwraca 401).
 *   - Brak tokenu i brak sesji → tryb "invalid" (trasa zwraca 401). Nie ma już
 *     cichego trybu lokalnego/ownera.
 */

import { tokenRepository } from "@/lib/repository/tokens";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export type AuthContext =
  | { mode: "user"; userId: string; accessToken?: string }
  | { mode: "invalid"; userId: null };

/** Wczytuje mapę token→userId z env. Puste/niepoprawne = brak tokenów. */
function loadTokenMap(): Record<string, string> {
  const raw = process.env.AURA_API_TOKENS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    console.error("[Aura] AURA_API_TOKENS musi być obiektem JSON token→userId");
    return {};
  } catch {
    console.error("[Aura] AURA_API_TOKENS nie jest poprawnym JSON-em");
    return {};
  }
}

/**
 * Ustala tożsamość: nagłówek Authorization: Bearer <token>, a w jego braku —
 * realna sesja Supabase z ciasteczek żądania. Bez żadnego z nich → "invalid".
 */
export async function authenticate(req: Request): Promise<AuthContext> {
  const header = req.headers.get("authorization");

  if (!header) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { mode: "invalid", userId: null };

    const {
      data: { session },
    } = await supabase.auth.getSession();
    return { mode: "user", userId: user.id, accessToken: session?.access_token };
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  if (!token) return { mode: "invalid", userId: null };

  // 1) mapa env (wstecz), 2) tokeny wygenerowane w panelu (hash w magazynie).
  const userId = loadTokenMap()[token] ?? (await tokenRepository.findUserId(token));
  if (!userId) return { mode: "invalid", userId: null };

  return { mode: "user", userId };
}

/** Waliduje datę w formacie YYYY-MM-DD (i że jest to realna data kalendarzowa). */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
