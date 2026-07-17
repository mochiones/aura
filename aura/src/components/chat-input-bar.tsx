"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Loader2, Mic, Square } from "lucide-react";
import { cn, makeTitleFromText, textToHtml, toDateKey } from "@/lib/utils";
import { useVoiceRecorder } from "@/components/voice-recorder";
import { useEntries } from "@/context/entries-context";

interface ChatInputBarProps {
  // Dzień, do którego trafi wpis. Brak = dziś (createdAt ustawia baza).
  targetDate?: Date;
  // "fixed" — przyklejony do dołu ekranu (mobile), "floating" — pływający pill w panelu (desktop).
  variant?: "fixed" | "floating";
}

// Buduje ISO date dla przeszłego dnia z bieżącą godziną.
function pastDayIso(targetDate: Date): string {
  const d = new Date(targetDate);
  const now = new Date();
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  return d.toISOString();
}

export function ChatInputBar({ targetDate, variant = "fixed" }: ChatInputBarProps) {
  const { addEntry } = useEntries();
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Transkrypt dokleja się do inputa — użytkownik może poprawić przed wysłaniem.
  const { state, formattedTime, error, startRecording, stopRecording } =
    useVoiceRecorder((t) => setText((prev) => (prev ? `${prev} ${t}` : t)));

  const isToday = !targetDate || toDateKey(targetDate) === toDateKey(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await addEntry({
        title: makeTitleFromText(trimmed),
        content: textToHtml(trimmed),
        tags: [],
        mood: null,
        createdAt: isToday || !targetDate ? undefined : pastDayIso(targetDate),
      });
      setText("");
      toast.success("Wpis zapisany");
    } catch {
      toast.error("Nie udało się zapisać wpisu. Spróbuj ponownie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        variant === "fixed"
          ? "fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#F7F6F3] via-[#F7F6F3]/90 to-transparent"
          : "pointer-events-none absolute inset-x-0 bottom-6 z-30 flex flex-col items-center px-6"
      )}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "pointer-events-auto flex items-center gap-1.5 rounded-full border border-[#EBEBF0] bg-white pl-4 pr-1.5 py-1.5 shadow-lg",
          variant === "floating" && "w-full max-w-xl"
        )}
      >
        {state === "recording" ? (
          <div className="flex-1 flex items-center gap-2 h-9 min-w-0">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-sm font-medium text-red-600 tabular-nums">
              {formattedTime}
            </span>
            <span className="text-sm text-[#9B9BAD] truncate">Nagrywanie — mów teraz…</span>
          </div>
        ) : (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={state === "processing" || isSaving}
            placeholder={state === "processing" ? "Transkrybuję…" : "Zapisz swoje myśli…"}
            aria-label="Treść wpisu"
            className="flex-1 h-9 min-w-0 bg-transparent outline-none text-[15px] text-[#1A1A2E] placeholder:text-[#9B9BAD] disabled:opacity-60"
          />
        )}

        {/* Mikrofon / stop */}
        <button
          type="button"
          onClick={state === "recording" ? stopRecording : startRecording}
          disabled={state === "processing" || isSaving}
          aria-label={
            state === "recording"
              ? "Zatrzymaj nagrywanie"
              : state === "processing"
              ? "Transkrybuję…"
              : "Nagraj głosowo"
          }
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
            state === "recording"
              ? "bg-red-500 text-white"
              : state === "processing"
              ? "bg-amber-50 text-amber-600"
              : "bg-[#1A1A2E] text-white hover:bg-[#333333]"
          )}
        >
          {state === "recording" ? (
            <Square className="h-4 w-4 fill-current" />
          ) : state === "processing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>

        {/* Wyślij — widoczny tylko gdy jest tekst */}
        {text.trim() && state === "idle" && (
          <button
            type="submit"
            disabled={isSaving}
            aria-label="Zapisz wpis"
            className="h-9 w-9 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#333333] transition-colors disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        )}
      </form>

      {error && (
        <p className="pointer-events-auto mt-2 px-4 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
