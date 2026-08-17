"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { Mono } from "@/components/docs/ui";

interface PublicToken {
  id: string;
  prefix: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TokenManager() {
  const [tokens, setTokens] = useState<PublicToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tokens");
      if (!res.ok) throw new Error();
      setTokens((await res.json()) as PublicToken[]);
    } catch {
      setError("Nie udało się wczytać tokenów.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/tokens", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as PublicToken & { token: string };
      setNewToken(data.token);
      setTokens((prev) => [
        { id: data.id, prefix: data.prefix, createdAt: data.createdAt },
        ...prev,
      ]);
    } catch {
      setError("Nie udało się wygenerować tokenu.");
    } finally {
      setGenerating(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Nie udało się usunąć tokenu.");
    }
  };

  const copy = async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Schowek może być niedostępny — token i tak jest widoczny do zaznaczenia.
    }
  };

  return (
    <section
      id="token"
      className="scroll-mt-6 rounded-2xl border border-[#EBEBF0] bg-[#F7F6F3] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A2E]">
            Twój token dostępu
          </h2>
          <p className="mt-1 text-[13px] text-[#5A5A6E]">
            Użyj go w nagłówku <Mono>Authorization: Bearer …</Mono>.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A2E] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#333333] disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Wygeneruj nowy token
        </button>
      </div>

      {/* Nowo wygenerowany token — pokazywany RAZ */}
      {newToken && (
        <div className="mt-4 rounded-lg border border-[#DDDBD6] bg-white p-3">
          <p className="mb-2 text-[12px] font-medium text-[#1A1A2E]">
            Skopiuj teraz — nie pokażemy go ponownie:
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded bg-[#1A1A2E] px-3 py-2 text-[12.5px] text-[#E8E6DF]">
              {newToken}
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label="Kopiuj token"
              className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg border border-[#DDDBD6] px-2.5 py-2 text-[12px] text-[#1A1A2E] transition-colors hover:bg-black/[0.04]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Skopiowano
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Kopiuj
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[13px] text-red-600">{error}</p>
      )}

      {/* Lista aktywnych tokenów */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
          Aktywne tokeny
        </p>
        {loading ? (
          <p className="mt-2 text-[13px] text-[#9B9BAD]">Wczytywanie…</p>
        ) : tokens.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#9B9BAD]">Brak tokenów.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#EBEBF0]">
            {tokens.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <code className="text-[13px] text-[#1A1A2E]">
                    {t.prefix}…
                  </code>
                  <span className="ml-2 text-[12px] text-[#9B9BAD]">
                    utworzony {formatDate(t.createdAt)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(t.id)}
                  aria-label="Usuń token"
                  className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] text-[#9B9BAD] transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Usuń
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
