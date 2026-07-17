import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Serwerowy klient Supabase powiązany z ciasteczkami żądania.
// Sesja zalogowanego użytkownika trafia do zapytań => RLS (owner = auth.uid()) działa.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Wywołane z Server Component — odświeżenie sesji obsługuje middleware.
          }
        },
      },
    }
  );
}
