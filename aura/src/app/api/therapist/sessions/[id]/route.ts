import { NextResponse } from "next/server";
import { sessionRepository } from "@/lib/therapist/json-session-repository";

// Pełna sesja z wiadomościami — do wczytania w UI.
// Brak sesji nie jest błędem: zwracamy 200 z `null` (panel pyta o nią przy każdym
// otwarciu dnia, a większość dni nie ma jeszcze rozmowy) — unika szumu 404 w konsoli.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await sessionRepository.getById(id);
    return NextResponse.json(session); // session albo null
  } catch {
    return NextResponse.json(
      { error: "Nie udało się wczytać rozmowy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await sessionRepository.delete(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Nie udało się usunąć rozmowy" },
      { status: 500 }
    );
  }
}
