/**
 * Przygotowanie wpisów dziennika jako kontekstu dla modelu.
 *
 * Wpisy trzymają treść jako HTML (Tiptap). Dla modelu wyciągamy czysty tekst
 * i dołączamy metadane (data, nastrój, tagi). Świadomie ograniczamy ilość
 * przekazywanych danych, żeby nie zawyżać kosztów tokenów — patrz PRD §7.
 */

import type { Entry, Mood } from "@/types/entry";

const MOOD_LABELS: Record<Mood, string> = {
  1: "bardzo źle",
  2: "źle",
  3: "neutralnie",
  4: "dobrze",
  5: "bardzo dobrze",
};

/** Usuwa znaczniki HTML i normalizuje białe znaki. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function moodText(mood: Mood | null): string {
  return mood ? `${mood}/5 (${MOOD_LABELS[mood]})` : "nie podano";
}

function isoDay(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

/** Pełny wpis dla modelu — używany, gdy analizujemy jeden konkretny dzień. */
export function formatEntryFull(entry: Entry): string {
  return [
    `Data: ${isoDay(entry.createdAt)}`,
    `Tytuł: ${entry.title}`,
    `Nastrój: ${moodText(entry.mood)}`,
    entry.tags.length ? `Tagi: ${entry.tags.join(", ")}` : null,
    `Treść:\n${stripHtml(entry.content)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Skrótowy wpis (bez pełnej treści) — używany na listach wielu dni. */
export function formatEntryBrief(entry: Entry, maxChars = 240): string {
  const text = stripHtml(entry.content);
  const snippet =
    text.length > maxChars ? `${text.slice(0, maxChars).trimEnd()}…` : text;
  return `- ${isoDay(entry.createdAt)} | nastrój ${moodText(entry.mood)} | "${entry.title}": ${snippet}`;
}

export interface MoodSummary {
  count: number;
  averageMood: number | null;
  distribution: Record<Mood, number>;
  firstDay: string | null;
  lastDay: string | null;
  topTags: { tag: string; count: number }[];
}

/** Agregaty nastroju z wielu wpisów — tanie w tokenach spojrzenie na trendy. */
export function buildMoodSummary(entries: Entry[]): MoodSummary {
  const distribution: Record<Mood, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const tagCounts = new Map<string, number>();
  let moodSum = 0;
  let moodCount = 0;

  for (const e of entries) {
    if (e.mood) {
      distribution[e.mood] += 1;
      moodSum += e.mood;
      moodCount += 1;
    }
    for (const tag of e.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const sortedDays = entries
    .map((e) => isoDay(e.createdAt))
    .sort();

  const topTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    count: entries.length,
    averageMood: moodCount ? Number((moodSum / moodCount).toFixed(2)) : null,
    distribution,
    firstDay: sortedDays[0] ?? null,
    lastDay: sortedDays[sortedDays.length - 1] ?? null,
    topTags,
  };
}
