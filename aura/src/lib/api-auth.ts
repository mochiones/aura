/**
 * Autoryzacja tokenem dla endpointów sterujących (API kontrolne).
 *
 * Faza 1 nie ma jeszcze bazy użytkowników ani better-auth w kodzie (patrz
 * pamięć projektu). Tożsamość ustalamy dwutorowo:
 *   1) STATYCZNA MAPA token → userId z env `AURA_API_TOKENS` (JSON; wstecz),
 *   2) tokeny wygenerowane w panelu /docs — hash w `data/tokens.json`
 *      (TokenRepository).
 * Nigdy nie commitujemy jawnych tokenów (env w `.env.local`, w magazynie tylko hash).
 *
 * Model użycia w trasach:
 *   - Nagłówek `Authorization: Bearer <token>` obecny i poprawny → tryb "user"
 *     (żądanie skopiowane do userId z mapy).
 *   - Nagłówek obecny, ale token nieznany → tryb "invalid" (trasa zwraca 401).
 *   - Brak nagłówka → tryb "local" (userId = null). Pozwala lokalnemu web UI
 *     działać bez tokenu na współdzielonych wpisach (userId === null).
 */

import { tokenRepository } from "@/lib/repository/json-token-repository";

export type AuthContext =
  | { mode: "user"; userId: string }
  | { mode: "local"; userId: null }
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

/** Ustala tożsamość na podstawie nagłówka Authorization: Bearer <token>. */
export async function authenticate(req: Request): Promise<AuthContext> {
  const header = req.headers.get("authorization");
  if (!header) return { mode: "local", userId: null };

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
