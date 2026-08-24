import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

/**
 * Klient Supabase do Route Handlerów / Server Components — czyta sesję z
 * ciasteczek żądania. `setAll` może nie zapisać ciasteczek poza middleware
 * (np. wywołany z Route Handlera po odpowiedzi) — to bezpieczne no-op,
 * bo realne odświeżanie sesji robi `middleware.ts` na każdym żądaniu.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Wywołane z kontekstu tylko-do-odczytu (np. Server Component) — ignorujemy.
        }
      },
    },
  });
}
