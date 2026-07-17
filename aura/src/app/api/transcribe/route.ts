import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Brak klucza GROQ_API_KEY" }, { status: 500 });
  }

  const formData = await req.formData();
  const audio = formData.get("audio");

  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json({ error: "Brak pliku audio" }, { status: 400 });
  }

  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Plik audio przekracza 25 MB" }, { status: 400 });
  }

  const file = new File([audio], "recording.webm", { type: audio.type });

  try {
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "pl",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: unknown) {
    // Bez tego bloku nieobsłużony wyjątek daje pustą odpowiedź 500
    // i „Unexpected end of JSON input" po stronie klienta.
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? (err as { status?: number }).status ?? 500
        : 500;
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    console.error("[Aura] Transkrypcja nie powiodła się:", message);

    const userMessage =
      status === 401
        ? "Klucz GROQ_API_KEY jest nieprawidłowy lub wygasł."
        : "Nie udało się przetworzyć nagrania. Spróbuj ponownie.";
    return NextResponse.json({ error: userMessage }, { status });
  }
}
