"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn, toDateKey } from "@/lib/utils";

interface DayStripProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  // Dni (klucze YYYY-MM-DD), które mają przynajmniej jeden wpis.
  entryDates: Set<string>;
  // Data najstarszego wpisu — wyznacza początek paska.
  oldestDate?: Date | null;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function DayStrip({
  selectedDate,
  onSelect,
  entryDates,
  oldestDate,
}: DayStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const today = startOfDay(new Date());

    // Początek: starszy z pary (najstarszy wpis, dziś − 14 dni).
    const start = startOfDay(today);
    start.setDate(start.getDate() - 14);
    if (oldestDate) {
      const oldest = startOfDay(oldestDate);
      if (oldest < start) start.setTime(oldest.getTime());
    }

    // Koniec: niedziela bieżącego tygodnia (tydzień od poniedziałku).
    const end = startOfDay(today);
    const dow = (today.getDay() + 6) % 7;
    end.setDate(end.getDate() + (6 - dow));

    const list: Date[] = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      list.push(new Date(d));
    }
    return list;
  }, [oldestDate]);

  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);

  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>(
      `[data-day="${selectedKey}"]`
    );
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selectedKey]);

  return (
    <div
      ref={scrollRef}
      role="tablist"
      aria-label="Dni"
      className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {days.map((day) => {
        const key = toDateKey(day);
        const isSelected = key === selectedKey;
        const isToday = key === todayKey;
        const isFuture = key > todayKey;
        const hasEntry = entryDates.has(key);

        return (
          <button
            key={key}
            data-day={key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={isFuture}
            onClick={() => onSelect(day)}
            className={cn(
              "flex flex-col items-center justify-center flex-shrink-0 w-12 h-16 rounded-2xl border transition-colors",
              isSelected
                ? "border-[#1A1A2E] bg-[#1A1A2E] text-white"
                : isToday
                ? "border-[#1A1A2E] bg-white text-[#1A1A2E]"
                : "border-[#EBEBF0] bg-white text-[#1A1A2E] hover:border-[#1A1A2E]/40",
              isFuture && "opacity-40"
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                isSelected ? "text-white/70" : "text-[#9B9BAD]"
              )}
            >
              {day.toLocaleDateString("pl-PL", { weekday: "short" }).replace(".", "")}
            </span>
            <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
            <span
              aria-hidden="true"
              className={cn(
                "w-1 h-1 rounded-full mt-0.5",
                hasEntry ? (isSelected ? "bg-white" : "bg-[#1A1A2E]") : "bg-transparent"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
