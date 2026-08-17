import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { askTherapist } from "@/lib/therapist/ask";
import { ValidationError, ConfigError } from "@/lib/errors";
import type { PersonaId } from "@/lib/therapist/persona";

export const maxDuration = 30;

interface AskBody {
  question?: string;
  day?: string;
  persona?: PersonaId;
}

export async function POST(req: Request) {
  const auth = await authenticate(req);
  if (auth.mode === "invalid") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question, day, persona }: AskBody = await req.json();

  try {
    const result = await askTherapist({
      question,
      day,
      persona,
      userId: auth.userId,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof ConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : "UNKNOWN";
    console.error("[Aura] /api/therapist/ask error:", message);
    return NextResponse.json({ error: "Agent request failed" }, { status: 500 });
  }
}
