import { createBrowserClient } from "@supabase/ssr";

// Klient Supabase dla komponentów działających w przeglądarce (formularz logowania).
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
