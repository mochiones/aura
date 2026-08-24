import { NextResponse } from "next/server";
import { tokenRepository } from "@/lib/repository/tokens";
import { authenticate } from "@/lib/api-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Unieważnia (usuwa) token po id — tylko dla zalogowanego właściciela. */
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const auth = await authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const removed = await tokenRepository.revoke(id, auth.userId);
    if (!removed) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to revoke token" }, { status: 500 });
  }
}
