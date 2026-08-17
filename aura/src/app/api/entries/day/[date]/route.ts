import { NextRequest, NextResponse } from "next/server";
import { entryRepository } from "@/lib/repository/json-entry-repository";
import { authenticate, isValidIsoDate } from "@/lib/api-auth";

type Params = { params: Promise<{ date: string }> };

/**
 * Endpoint (3): wpis na konkretny dzień.
 *
 * Zawsze zwraca 200 z informacją, czy na dany dzień jest wpis:
 *   { date, exists: true,  entry: <najnowszy wpis z mood/treścią/tagami> }
 *   { date, exists: false, entry: null }
 * Dzień może mieć wiele wpisów — zwracamy JEDEN, najnowszy. Skopiowane po
 * użytkowniku z tokenu (401 zły token, 400 zła data).
 */
export async function GET(req: NextRequest, { params }: Params) {
  const auth = authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  if (!isValidIsoDate(date)) {
    return NextResponse.json(
      { error: "Date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  try {
    // getAll zwraca posortowane malejąco po dacie → pierwszy trafiony = najnowszy.
    // Skopiowane po userId (string dla usera, null dla trybu lokalnego).
    const entries = await entryRepository.getAll(auth.userId);

    const entry = entries.find((e) => e.createdAt.slice(0, 10) === date) ?? null;
    return NextResponse.json({ date, exists: entry !== null, entry });
  } catch {
    return NextResponse.json({ error: "Failed to load entry" }, { status: 500 });
  }
}
