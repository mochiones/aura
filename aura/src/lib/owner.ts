/**
 * Historyczny id "właściciela" z Fazy 1 (sprzed logowania) = ten sam UUID co
 * realne konto Supabase Auth właściciela. Po wdrożeniu Supabase Auth żadna
 * trasa żądań już tego nie woła jako fallback tożsamości (patrz api-auth.ts) —
 * wartość zostaje tylko jako referencja do jednorazowych skryptów porządkowych.
 */
export function getOwnerUserId(): string {
  return process.env.SUPABASE_OWNER_ID ?? "local-owner";
}
