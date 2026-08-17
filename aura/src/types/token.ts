/** Rekord tokenu API. Przechowujemy HASH (SHA-256), nigdy jawny token. */
export interface TokenRecord {
  id: string;
  hash: string;
  /** Początek tokenu do wyświetlania na liście (np. "aura_1a2b3c"). */
  prefix: string;
  userId: string;
  createdAt: string; // ISO 8601
}

/** Publiczna reprezentacja tokenu (bez hasha) — bezpieczna do zwrócenia do UI. */
export interface PublicToken {
  id: string;
  prefix: string;
  createdAt: string;
}
