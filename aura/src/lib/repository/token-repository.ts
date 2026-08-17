import type { PublicToken } from "@/types/token";

export interface TokenRepository {
  /** Aktywne tokeny użytkownika (bez hasha), najnowsze pierwsze. */
  list(userId: string): Promise<PublicToken[]>;
  /** Generuje nowy token dla użytkownika. Zwraca PEŁNY token TYLKO tutaj (raz). */
  create(userId: string): Promise<{ token: string; record: PublicToken }>;
  /** Zwraca userId dla podanego (jawnego) tokenu albo null. */
  findUserId(token: string): Promise<string | null>;
  /** Usuwa token po id (w obrębie userId). Zwraca true, jeśli coś usunięto. */
  revoke(id: string, userId: string): Promise<boolean>;
}
