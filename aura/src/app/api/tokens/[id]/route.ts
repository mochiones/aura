import { NextResponse } from "next/server";
import { tokenRepository } from "@/lib/repository/json-token-repository";
import { getOwnerUserId } from "@/lib/owner";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Unieważnia (usuwa) token po id. Faza 1: lokalnie, bez Bearera. */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const removed = await tokenRepository.revoke(id, getOwnerUserId());
    if (!removed) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to revoke token" }, { status: 500 });
  }
}
