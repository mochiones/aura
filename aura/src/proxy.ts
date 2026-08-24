import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware-client";

// Strony niewymagające zalogowania (dokumentacja zostaje publiczna — tylko
// panel tokenów wewnątrz /docs jest gated, patrz TokenManagerGate).
const PUBLIC_PATHS = ["/login", "/auth", "/docs"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Nigdy nie przechwytuj /api/** — te trasy zwracają JSON 401 same, nie
  // powinny dostawać przekierowania HTML z middleware.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
