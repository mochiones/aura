import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getDayEntry } from "@/lib/entries/service";
import { ValidationError } from "@/lib/errors";

type Params = { params: Promise<{ date: string }> };

/**
 * Endpoint (3): wpis na konkretny dzień.
 *
 * Zawsze zwraca 200 z informacją, czy na dany dzień jest wpis:
 *   { date, exists: true,  entry: <najnowszy wpis z mood/treścią/tagami> }
 *   { date, exists: false, entry: null }
 * Skopiowane po użytkowniku z tokenu (401 zły token, 400 zła data).
 */
export async function GET(req: NextRequest, { params }: Params) {
  const auth = authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;

  try {
    const result = await getDayEntry(date, auth.userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to load entry" }, { status: 500 });
  }
}
