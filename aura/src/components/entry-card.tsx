"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOOD_COLORS, MOOD_EMOJI } from "@/lib/mood";
import type { Entry, Mood } from "@/types/entry";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

interface EntryCardProps {
  entry: Entry;
  onTagClick?: (tag: string) => void;
}

export function EntryCard({ entry, onTagClick }: EntryCardProps) {
  const moodColor = entry.mood ? MOOD_COLORS[entry.mood] : "#EBEBF0";
  const preview = stripHtml(entry.content).slice(0, 150);

  return (
    <Link href={`/entries/${entry.id}`} className="block group">
      <Card className="overflow-hidden border border-[#EBEBF0] shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white">
        <div className="flex">
          <CardContent className="flex-1 px-4 py-4">
            {/* Nagłówek */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-lg font-semibold text-[#1A1A2E] leading-tight group-hover:text-[#1A1A2E] transition-colors line-clamp-2">
                {entry.title}
              </h2>
              {entry.mood && (
                <span
                  className="text-xl flex-shrink-0"
                  aria-label={`Nastrój: ${MOOD_EMOJI[entry.mood as Mood]}`}
                >
                  {MOOD_EMOJI[entry.mood as Mood]}
                </span>
              )}
            </div>

            {/* Data */}
            <p className="text-sm text-[#9B9BAD] mb-2">
              {formatDate(entry.createdAt)}
            </p>

            {/* Preview treści */}
            {preview && (
              <p className="text-sm text-[#1A1A2E]/70 line-clamp-2 mb-3">
                {preview}
              </p>
            )}

            {/* Tagi */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-full text-xs cursor-pointer hover:bg-[#1A1A2E]/10 hover:border-[#1A1A2E]"
                    onClick={(e) => {
                      e.preventDefault();
                      onTagClick?.(tag);
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
