/** Błędy domenowe współdzielone przez serwisy (API + MCP). */

/** Niepoprawne dane wejściowe → 400 (API) / isError (MCP). */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Brak/zła konfiguracja środowiska (np. brak klucza) → 500. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
