import { NextResponse } from "next/server";
import { tokenRepository } from "@/lib/repository/tokens";
import { getOwnerUserId } from "@/lib/owner";

// crypto (SHA-256) w magazynie → runtime Node.
export const runtime = "nodejs";

/**
 * Zarządzanie tokenami API. Faza 1: brak logowania, więc panel /docs woła te
 * endpointy lokalnie bez Bearera. Tokeny są skopiowane do jednego właściciela
 * (getOwnerUserId). Do czasu Fazy 2 (auth) to celowe uproszczenie.
 */
export async function GET() {
  try {
    const tokens = await tokenRepository.list(getOwnerUserId());
    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: "Failed to load tokens" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { token, record } = await tokenRepository.create(getOwnerUserId());
    // Pełny token zwracamy TYLKO tutaj (raz) — potem tylko prefix.
    return NextResponse.json({ token, ...record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
