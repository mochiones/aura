"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Mic, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { MoodPicker } from "@/components/mood-picker";
import { useVoiceRecorder } from "@/components/voice-recorder";
import { useEntries } from "@/context/entries-context";
import { cn, makeTitleFromText, textToHtml, toDateKey } from "@/lib/utils";
import { MOOD_EMOJI } from "@/lib/mood";
import type { Entry, Mood } from "@/types/entry";

interface DayViewProps {
  date: Date;
  // Wpisy wybranego dnia, chronologicznie.
  entries: Entry[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DayView({ date, entries }: DayViewProps) {
  const { addEntry } = useEntries();

  const key = toDateKey(date);
  const todayKey = toDateKey(new Date());
  const isToday = key === todayKey;
  const isFuture = key > todayKey;

  // Po transkrypcji nie zapisujemy od razu — pokazujemy podsumowanie z wyborem nastroju.
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [pendingMood, setPendingMood] = useState<Mood | null>(null);
  const [saving, setSaving] = useState(false);

  const handleTranscribed = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPendingMood(null);
    setPendingText(trimmed);
  };

  // Zapis wpisu z wybranym nastrojem (lub bez, jeśli pominięty).
  const savePending = async () => {
    if (!pendingText || saving) return;
    setSaving(true);
    try {
      let createdAt: string | undefined;
      if (!isToday) {
        const d = new Date(date);
        const now = new Date();
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
        createdAt = d.toISOString();
      }
      await addEntry({
        title: makeTitleFromText(pendingText),
        content: textToHtml(pendingText),
        tags: [],
        mood: pendingMood,
        createdAt,
      });
      toast.success("Wpis zapisany");
      setPendingText(null);
      setPendingMood(null);
    } catch {
      toast.error("Nie udało się zapisać wpisu. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  const { state, formattedTime, error, startRecording, stopRecording } =
    useVoiceRecorder(handleTranscribed);

  const dayLabel = date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="px-5 pt-4">
      {/* Nagłówek dnia */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9B9BAD] mb-4">
        {dayLabel.replace(",", " ·")}
      </p>

      {entries.length > 0 ? (
        <div className="space-y-10 pb-4">
          {entries.map((entry) => (
            <article key={entry.id}>
              <Link href={`/entries/${entry.id}`} className="block group">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] text-[#9B9BAD]">
                  <span>{formatTime(entry.createdAt)}</span>
                  {entry.mood && (
                    <span className="text-sm">{MOOD_EMOJI[entry.mood as Mood]}</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-[#1A1A2E] leading-tight group-active:opacity-70 transition-opacity">
                  {entry.title}
                </h2>
              </Link>

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <TiptapEditor content={entry.content} editable={false} />
              </div>
            </article>
          ))}
        </div>
      ) : isFuture ? (
        <div className="py-20 text-center text-sm text-[#9B9BAD]">
          Ten dzień jeszcze przed Tobą.
        </div>
      ) : (
        // Pusty dzień — duży mikrofon do nagrania przemyśleń.
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <button
            type="button"
            onClick={state === "recording" ? stopRecording : startRecording}
            disabled={state === "processing"}
            aria-label={
              state === "recording" ? "Zatrzymaj nagrywanie" : "Nagraj przemyślenia"
            }
            className={cn(
              "h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-colors",
              state === "recording"
                ? "bg-red-500 text-white animate-pulse"
                : "bg-[#1A1A2E] text-white hover:bg-[#333333]"
            )}
          >
            {state === "processing" ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>
          <p className="mt-4 text-sm text-[#9B9BAD] max-w-[220px] leading-relaxed">
            {isToday
              ? "Nagraj swoje przemyślenia z dzisiejszego dnia"
              : "Nagraj swoje przemyślenia z tego dnia"}
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      )}

      {/* Bottom sheet podczas nagrywania / transkrypcji (wzorzec z edytora) */}
      {(state === "recording" || state === "processing") && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={state === "recording" ? stopRecording : undefined}
          />
          <div className="relative bg-white rounded-t-2xl border-t border-[#EBEBF0] px-5 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="w-9 h-1 rounded-full bg-[#EBEBF0] mx-auto mb-5" />

            {state === "recording" && (
              <>
                <div
                  className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 animate-pulse"
                  aria-hidden="true"
                >
                  <Mic className="h-7 w-7 text-red-500" />
                </div>
                <p className="text-3xl font-medium text-[#1A1A2E] text-center mb-1 tabular-nums">
                  {formattedTime}
                </p>
                <p className="text-sm text-[#9B9BAD] text-center mb-5">
                  Nagrywanie — mów teraz…
                </p>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-full h-12 rounded-full bg-[#1A1A2E] text-white font-medium text-base flex items-center justify-center gap-2"
                >
                  <Square className="h-4 w-4 fill-white" />
                  Zatrzymaj i transkrybuj
                </button>
              </>
            )}

            {state === "processing" && (
              <>
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="h-7 w-7 text-amber-600 animate-spin" />
                </div>
                <p className="text-base font-medium text-[#1A1A2E] text-center mb-1">
                  Transkrybuję nagranie…
                </p>
                <p className="text-sm text-[#9B9BAD] text-center">
                  To zajmuje kilka sekund
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Podsumowanie po nagraniu — wybór nastroju przed zapisem */}
      {pendingText !== null && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative bg-white rounded-t-2xl border-t border-[#EBEBF0] px-5 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="w-9 h-1 rounded-full bg-[#EBEBF0] mx-auto mb-5" />

            <p className="text-base font-medium text-[#1A1A2E] text-center mb-1">
              Jak się czujesz?
            </p>
            <p className="text-sm text-[#9B9BAD] text-center mb-4">
              Zapisz nastrój do tego wpisu (możesz pominąć)
            </p>

            <p className="text-sm text-[#6B6B7B] bg-[#F7F6F3] rounded-xl px-3 py-2 mb-5 line-clamp-3">
              {pendingText}
            </p>

            <div className="flex justify-center mb-6">
              <MoodPicker value={pendingMood} onChange={setPendingMood} />
            </div>

            <button
              type="button"
              onClick={savePending}
              disabled={saving}
              className="w-full h-12 rounded-full bg-[#1A1A2E] text-white font-medium text-base flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Zapisz wpis"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
