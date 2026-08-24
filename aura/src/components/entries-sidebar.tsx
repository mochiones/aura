"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, LogOut, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntries } from "@/context/entries-context";
import { MOOD_ARIA_LABELS, MOOD_EMOJI, MOODS } from "@/lib/mood";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { Entry, Mood } from "@/types/entry";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getDateGroup(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Dzisiaj";
  if (diffDays === 1) return "Wczoraj";
  if (diffDays <= 7) return "Ostatnie 7 dni";
  if (diffDays <= 30) return "Ostatni miesiąc";
  return "Starsze";
}

const GROUP_ORDER = ["Dzisiaj", "Wczoraj", "Ostatnie 7 dni", "Ostatni miesiąc", "Starsze"];

function groupEntries(entries: Entry[]): { label: string; items: Entry[] }[] {
  const map = new Map<string, Entry[]>();
  for (const entry of entries) {
    const label = getDateGroup(entry.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(entry);
  }
  return GROUP_ORDER
    .filter((label) => map.has(label))
    .map((label) => ({ label, items: map.get(label)! }));
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function SidebarEntry({ entry, isActive }: { entry: Entry; isActive: boolean }) {
  const preview = stripHtml(entry.content).slice(0, 70);
  const group = getDateGroup(entry.createdAt);
  const timeLabel = group === "Dzisiaj" ? formatTime(entry.createdAt) : formatDateShort(entry.createdAt);
  const dateFull = formatDateFull(entry.createdAt);

  return (
    <Link
      href={`/entries/${entry.id}`}
      className={cn(
        "block px-4 py-2.5 transition-colors border-b border-[#EBEBF0]/60",
        isActive ? "bg-[#E8E6DF]" : "hover:bg-black/[0.04]"
      )}
    >
      {/* Data i dzień tygodnia */}
      <p className="text-[10px] text-[#9B9BAD]/70 mb-0.5 capitalize">{dateFull}</p>

      {/* Tytuł + mood */}
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-[13px] font-semibold text-[#1A1A2E] truncate leading-snug">
          {entry.title}
        </span>
        {entry.mood && (
          <span className="text-sm flex-shrink-0">{MOOD_EMOJI[entry.mood as Mood]}</span>
        )}
      </div>

      {/* Czas + preview */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-medium text-[#9B9BAD] flex-shrink-0">{timeLabel}</span>
        {preview && (
          <span className="text-[11px] text-[#9B9BAD]/80 truncate">{preview}</span>
        )}
      </div>
    </Link>
  );
}

export function EntriesSidebar() {
  const {
    entries,
    filteredEntries,
    isLoading,
    filters,
    fetchEntries,
    setMoodFilter,
    setTagFilter,
    clearFilters,
  } = useEntries();

  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSupabaseUser();

  const handleSignOut = async () => {
    await createBrowserSupabaseClient().auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [entries]);

  const [search, setSearch] = useState("");

  const hasActiveFilters = filters.mood !== null || filters.tag !== null;

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredEntries;
    return filteredEntries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        stripHtml(e.content).toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [filteredEntries, search]);

  const groups = useMemo(() => groupEntries(searchResults), [searchResults]);

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col border-r border-[#DDDBD6] bg-[#F2F1EC] overflow-hidden">
      {/* Nagłówek */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[#1A1A2E]">Twoje wpisy</h2>
          <Link
            href="/entries/new"
            className={cn(
              "h-7 w-7 rounded-full bg-[#1A1A2E] hover:bg-[#333333] text-white flex items-center justify-center transition-colors flex-shrink-0",
              pathname === "/entries/new" && "opacity-40 pointer-events-none"
            )}
            aria-label="Nowy wpis"
          >
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Wyszukiwarka */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9B9BAD]" />
          <input
            type="text"
            placeholder="Szukaj..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-[12px] bg-black/[0.06] rounded-lg border-none outline-none placeholder:text-[#9B9BAD] text-[#1A1A2E]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9B9BAD] hover:text-[#1A1A2E]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filtry nastrojów */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 flex-wrap">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setMoodFilter(filters.mood === mood ? null : mood as Mood)}
                  aria-label={MOOD_ARIA_LABELS[mood as Mood]}
                  aria-pressed={filters.mood === mood}
                  className={cn(
                    "text-sm h-7 w-7 rounded-lg border transition-all",
                    filters.mood === mood
                      ? "border-[#1A1A2E] bg-[#1A1A2E]/10"
                      : "border-[#DDDBD6] bg-white/60 hover:border-[#1A1A2E]/40"
                  )}
                >
                  {MOOD_EMOJI[mood as Mood]}
                </button>
              ))}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-1.5 rounded-full text-[10px] text-[#9B9BAD] hover:text-[#1A1A2E]"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {allTags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tag === tag ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer rounded-full text-[10px] px-2 py-0 h-5 transition-all border-[#DDDBD6]",
                      filters.tag === tag
                        ? "bg-[#1A1A2E] text-white border-[#1A1A2E]"
                        : "bg-white/60 hover:border-[#1A1A2E]/50"
                    )}
                    onClick={() => setTagFilter(filters.tag === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#DDDBD6]" />

      {/* Lista z grupami dat */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16 bg-black/10" />
                <Skeleton className="h-4 w-3/4 bg-black/10" />
                <Skeleton className="h-3 w-full bg-black/10" />
              </div>
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-4 text-center text-[11px] text-[#9B9BAD]">
            {search.trim()
              ? `Brak wyników dla „${search}"`
              : hasActiveFilters
              ? "Brak wyników dla wybranych filtrów"
              : "Brak wpisów"}
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label}>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[11px] font-semibold text-[#9B9BAD] uppercase tracking-wide">
                  {label}
                </span>
              </div>
              {items.map((entry) => (
                <SidebarEntry
                  key={entry.id}
                  entry={entry}
                  isActive={pathname === `/entries/${entry.id}`}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Stopka z licznikiem */}
      <div className="border-t border-[#DDDBD6] px-4 py-2">
        <p className="text-[10px] text-[#9B9BAD] text-center">
          {entries.length === 0
            ? "Brak wpisów"
            : `${entries.length} ${entries.length === 1 ? "wpis" : entries.length < 5 ? "wpisy" : "wpisów"}`}
        </p>
      </div>

      {/* Belka użytkownika: e-mail + dokumentacja API + wylogowanie */}
      <div className="border-t border-[#DDDBD6] px-4 py-2 flex items-center justify-between gap-2">
        <span
          className="text-[11px] text-[#9B9BAD] truncate"
          title={user?.email ?? ""}
        >
          {user?.email ?? "…"}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href="/docs"
            aria-label="Dokumentacja API"
            aria-current={pathname === "/docs" ? "page" : undefined}
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
              pathname === "/docs"
                ? "bg-[#1A1A2E]/10 text-[#1A1A2E]"
                : "text-[#9B9BAD] hover:text-[#1A1A2E] hover:bg-black/[0.04]"
            )}
          >
            <FileText className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label="Wyloguj"
            onClick={handleSignOut}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-[#9B9BAD] hover:text-[#1A1A2E] hover:bg-black/[0.04] transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
