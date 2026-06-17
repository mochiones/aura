"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EntryCard } from "@/components/entry-card";
import { useEntries } from "@/context/entries-context";
import { MOOD_ARIA_LABELS, MOOD_EMOJI, MOODS } from "@/lib/mood";
import type { Mood } from "@/types/entry";

function EntriesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-[#EBEBF0] bg-white p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-1" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
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

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [entries]);

  const hasActiveFilters = filters.mood !== null || filters.tag !== null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Nagłówek */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Twoje wpisy</h1>
          <p className="text-sm text-[#9B9BAD] mt-0.5">
            {entries.length === 0
              ? "Brak wpisów"
              : `${entries.length} ${entries.length === 1 ? "wpis" : entries.length < 5 ? "wpisy" : "wpisów"}`}
          </p>
        </div>
      </div>

      {/* Pasek filtrów */}
      {entries.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {MOODS.map((mood) => (
              <button
                key={mood}
                onClick={() =>
                  setMoodFilter(filters.mood === mood ? null : mood as Mood)
                }
                aria-label={MOOD_ARIA_LABELS[mood as Mood]}
                aria-pressed={filters.mood === mood}
                className={`text-xl h-9 w-9 rounded-xl border transition-all ${
                  filters.mood === mood
                    ? "border-[#7C6FCD] bg-[#7C6FCD]/10"
                    : "border-[#EBEBF0] bg-white hover:border-[#7C6FCD]/50"
                }`}
              >
                {MOOD_EMOJI[mood as Mood]}
              </button>
            ))}

            {allTags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap ml-1">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tag === tag ? "default" : "outline"}
                    className={`cursor-pointer rounded-full text-xs transition-all ${
                      filters.tag === tag
                        ? "bg-[#7C6FCD] text-white border-[#7C6FCD]"
                        : "hover:border-[#7C6FCD]"
                    }`}
                    onClick={() =>
                      setTagFilter(filters.tag === tag ? null : tag)
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-full h-8 text-xs text-[#9B9BAD] hover:text-[#1A1A2E] ml-1"
              >
                <X className="h-3 w-3 mr-1" />
                Wyczyść filtry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Lista wpisów */}
      {isLoading ? (
        <EntriesSkeleton />
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📓</div>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">
            Brak wpisów
          </h2>
          <p className="text-sm text-[#9B9BAD] mb-6">
            Zacznij od dodania pierwszego wpisu.
          </p>
          <Link
            href="/entries/new"
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-full bg-[#7C6FCD] hover:bg-[#6B5EBC] text-white px-6"
            )}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nowy wpis
          </Link>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">
            Brak wyników
          </h2>
          <p className="text-sm text-[#9B9BAD] mb-4">
            Żaden wpis nie pasuje do wybranych filtrów.
          </p>
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="rounded-full border border-[#EBEBF0] text-sm"
          >
            Wyczyść filtry
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onTagClick={(tag) => setTagFilter(tag)}
            />
          ))}
        </div>
      )}

      {/* FAB na mobile */}
      <Link
        href="/entries/new"
        aria-label="Dodaj nowy wpis"
        className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-[#7C6FCD] hover:bg-[#6B5EBC] text-white shadow-lg flex items-center justify-center transition-colors"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
