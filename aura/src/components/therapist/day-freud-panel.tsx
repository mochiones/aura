"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send, Mic, Square, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/components/voice-recorder";
import { getPersona } from "@/lib/therapist/persona";
import type { TherapistSession } from "@/types/therapist";

const persona = getPersona("freud");

function toUIMessages(session: TherapistSession): UIMessage[] {
  return session.messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: "text", text: m.content }],
  }));
}

function DayFreudChat({ entryId }: { entryId: string }) {
  // Jedna trwała rozmowa przypięta do tego wpisu/dnia.
  const sessionId = `entry-${entryId}`;

  const [input, setInput] = useState("");
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/therapist/chat",
        body: { sessionId, openDayEntryId: entryId, persona: "freud" },
      }),
    [sessionId, entryId]
  );

  // Wczytaj wcześniejszą rozmowę o tym dniu (jeśli istnieje).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/therapist/sessions/${sessionId}`);
        if (active && res.ok) {
          const session: TherapistSession | null = await res.json();
          if (session) setInitialMessages(toUIMessages(session));
        }
      } catch {
        /* brak historii — trudno */
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const { messages, sendMessage, status, error } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  // Auto-wysokość pola: rośnie z treścią do limitu, potem scroll pionowy.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const {
    state: recState,
    formattedTime,
    error: recError,
    startRecording,
    stopRecording,
  } = useVoiceRecorder((text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  });
  const isRecording = recState === "recording";
  const isTranscribing = recState === "processing";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput("");
  }

  // Nie renderuj, dopóki nie wiemy, czy jest historia (uniknięcie migotania).
  if (!loaded) {
    return (
      <div className="border-t border-[#EBEBF0] pt-6 text-[#9B9BAD] text-xs uppercase tracking-wide">
        {persona.sessionTitle}
      </div>
    );
  }

  return (
    <div className="border-t border-[#EBEBF0] pt-6">
      {/* Nagłówek panelu */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between text-[#9B9BAD] hover:text-[#1A1A2E] transition-colors mb-4"
      >
        <span className="text-xs uppercase tracking-wide font-medium">
          {persona.sessionTitle}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            collapsed && "-rotate-90"
          )}
        />
      </button>

      {!collapsed && (
        <>
          {/* Wiadomości */}
          <div
            ref={scrollRef}
            className="max-h-[420px] overflow-y-auto space-y-3 mb-3"
          >
            {/* Powitanie (statyczne, gdy brak rozmowy) */}
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed bg-[#F7F6F3] text-[#6B6B7B] italic">
                  {persona.greeting}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const text = message.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { text: string }).text)
                .join("");
              const isUser = message.role === "user";
              if (!text) return null;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                      isUser
                        ? "bg-[#1A1A2E] text-white rounded-br-sm"
                        : "bg-[#F7F6F3] text-[#1A1A2E] rounded-bl-sm"
                    )}
                  >
                    {text}
                  </div>
                </div>
              );
            })}

            {isBusy && (
              <div className="flex justify-start">
                <div className="bg-[#F7F6F3] text-[#9B9BAD] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
                  Freud się zastanawia…
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
                Freud nie mógł odpowiedzieć. Sprawdź, czy klucz{" "}
                <code className="font-mono text-xs">XAI_API_KEY</code> jest
                poprawny i czy konto xAI ma kredyty, a potem spróbuj ponownie.
              </div>
            )}
          </div>

          {isRecording ? (
            <p className="text-[10px] text-red-500 mb-1.5">
              Nagrywanie… {formattedTime} — dotknij, aby zakończyć
            </p>
          ) : isTranscribing ? (
            <p className="text-[10px] text-[#9B9BAD] mb-1.5">
              Zamieniam mowę na tekst…
            </p>
          ) : recError ? (
            <p className="text-[10px] text-red-500 mb-1.5">{recError}</p>
          ) : null}

          {/* Pole wejścia */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="h-9 w-7 shrink-0 flex items-center justify-center">
              <div className="h-7 w-7 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center text-[10px] font-bold">
                ZF
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={1}
              placeholder="porozmawiaj z Freudem…"
              className="flex-1 resize-none rounded-2xl border border-[#EBEBF0] bg-white px-4 py-2 text-sm outline-none focus:border-[#1A1A2E] overflow-y-auto leading-relaxed"
            />
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isBusy || isTranscribing}
              className={cn(
                "h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors disabled:opacity-40",
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                  : "bg-white border border-[#EBEBF0] text-[#1A1A2E] hover:bg-[#EBEBF0]"
              )}
              aria-label={isRecording ? "Zakończ nagrywanie" : "Nagraj głosówkę"}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isBusy}
              className="h-9 w-9 shrink-0 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center hover:bg-[#333333] disabled:opacity-40 transition-colors"
              aria-label="Wyślij"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <p className="text-[10px] text-[#9B9BAD] text-center mt-2">
            Narzędzie do autorefleksji — nie zastępuje terapeuty ani lekarza.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Panel „Sesja z dr. Freudem" osadzany pod wpisem dnia. Freud dostaje kontekst
 * tego konkretnego wpisu (openDayEntryId) i komentuje jego treść oraz nastrój.
 */
export function DayFreudPanel({ entryId }: { entryId: string }) {
  return (
    <Suspense fallback={null}>
      <DayFreudChat entryId={entryId} />
    </Suspense>
  );
}
