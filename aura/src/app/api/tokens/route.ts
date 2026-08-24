import { NextResponse } from "next/server";
import { tokenRepository } from "@/lib/repository/tokens";
import { authenticate } from "@/lib/api-auth";

// crypto (SHA-256) w magazynie → runtime Node.
export const runtime = "nodejs";

/**
 * Zarządzanie tokenami API. Panel /docs jest wołany z zalogowanej przeglądarki
 * (ciasteczko sesji), więc `authenticate()` rozwiąże realnego użytkownika —
 * bez sesji/tokenu żądanie dostaje 401.
 */
export async function GET(req: Request) {
  const auth = await authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const tokens = await tokenRepository.list(auth.userId);
    return NextResponse.json(tokens);
  } catch (err) {
    console.error("[Aura] GET /api/tokens error:", err);
    return NextResponse.json({ error: "Failed to load tokens" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { token, record } = await tokenRepository.create(auth.userId);
    // Pełny token zwracamy TYLKO tutaj (raz) — potem tylko prefix.
    return NextResponse.json({ token, ...record }, { status: 201 });
  } catch (err) {
    console.error("[Aura] POST /api/tokens error:", err);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
