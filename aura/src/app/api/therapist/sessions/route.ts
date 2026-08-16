import { NextResponse } from "next/server";
import { sessionRepository } from "@/lib/therapist/json-session-repository";

// Lista sesji (bez treści wiadomości), najnowsze pierwsze.
export async function GET() {
  try {
    const sessions = await sessionRepository.listSummaries();
    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json(
      { error: "Nie udało się wczytać historii rozmów" },
      { status: 500 }
    );
  }
}
