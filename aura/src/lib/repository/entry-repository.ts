import type { Entry, NewEntry } from "@/types/entry";

/** Opcje tworzenia wpisu — skopiowanie po użytkowniku i nadpisanie daty. */
export interface CreateOptions {
  /** Właściciel wpisu. Domyślnie null (tryb lokalny / Faza 1). */
  userId?: string | null;
  /** Data utworzenia (ISO). Domyślnie "teraz". Pozwala zapisać wpis na inny dzień. */
  createdAt?: string;
}

/**
 * Opcje mutacji (update/delete) — ustalają, kto ma prawo zmienić dany wpis.
 * `accessToken`, gdy podany, kieruje żądanie jako ten użytkownik (klucz anon +
 * jego JWT) — RLS samo odrzuci cudzy wiersz. Bez niego repozytorium filtruje
 * po `userId` w warstwie aplikacji (klienci tokenów API/MCP bez prawdziwego JWT).
 */
export interface MutateOptions {
  userId?: string | null;
  accessToken?: string;
}

export interface EntryRepository {
  /**
   * Zwraca wpisy posortowane malejąco po dacie.
   * @param userId gdy podany (string lub null) — filtruje po właścicielu;
   *   gdy pominięty (undefined) — zwraca wszystkie (zachowanie zgodne z Fazą 1).
   */
  getAll(userId?: string | null): Promise<Entry[]>;
  /** Pobiera wpis po id; gdy podano userId, zwraca go tylko dla właściciela. */
  getById(id: string, userId?: string | null): Promise<Entry | null>;
  create(data: NewEntry, opts?: CreateOptions): Promise<Entry>;
  update(id: string, data: Partial<NewEntry>, opts?: MutateOptions): Promise<Entry>;
  delete(id: string, opts?: MutateOptions): Promise<void>;
}
