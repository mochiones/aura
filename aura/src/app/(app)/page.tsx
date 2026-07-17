"use client";

import { useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DayStrip } from "@/components/day-strip";
import { DayView } from "@/components/day-view";
import { ChatInputBar } from "@/components/chat-input-bar";
import { useEntries } from "@/context/entries-context";
import { toDateKey } from "@/lib/utils";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function DaySkeleton() {
  return (
    <div className="px-5 pt-4 space-y-3">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export default function HomePage() {
  const { entries, isLoading, fetchEntries } = useEntries();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Dni z przynajmniej jednym wpisem (kropki na pasku dni).
  const entryDates = useMemo(
    () => new Set(entries.map((e) => toDateKey(new Date(e.createdAt)))),
    [entries]
  );

  const oldestDate = useMemo(() => {
    if (entries.length === 0) return null;
    return new Date(
      Math.min(...entries.map((e) => new Date(e.createdAt).getTime()))
    );
  }, [entries]);

  // Wpisy wybranego dnia, chronologicznie.
  const dayEntries = useMemo(() => {
    const key = toDateKey(selectedDate);
    return entries
      .filter((e) => toDateKey(new Date(e.createdAt)) === key)
      .sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [entries, selectedDate]);

  const isFutureSelected = toDateKey(selectedDate) > toDateKey(new Date());

  return (
    <>
      {/* Desktop: ekran powitalny (lista jest w sidebarze) + pływający input bar */}
      <div className="hidden md:flex relative flex-1 items-center justify-center h-full text-center select-none px-8">
        <div>
          <div className="text-5xl mb-4">📓</div>
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">Witaj! Jak się czujesz?</h2>
          <p className="text-sm text-[#9B9BAD] max-w-xs leading-relaxed">
            To jest Twój dziennik Aura, który ma na celu zebranie dla Ciebie Twoich myśli.
          </p>
        </div>
        <ChatInputBar variant="floating" />
      </div>

      {/* Mobile: widok „dzień po dniu" */}
      <div className="md:hidden">
        {/* Sticky nagłówek: data + wylogowanie + pasek dni */}
        <div className="sticky top-0 z-30 bg-[#F7F6F3]/95 backdrop-blur-sm border-b border-[#EBEBF0]/60">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-[#1A1A2E]">
              {selectedDate.toLocaleDateString("pl-PL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                title="Wyloguj się"
                aria-label="Wyloguj się"
                className="h-9 w-9 rounded-full bg-white border border-[#EBEBF0] flex items-center justify-center text-[#1A1A2E] hover:border-[#1A1A2E]/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <DayStrip
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            entryDates={entryDates}
            oldestDate={oldestDate}
          />
        </div>

        {isLoading ? (
          <DaySkeleton />
        ) : (
          <DayView date={selectedDate} entries={dayEntries} />
        )}

        {/* Miejsce pod zafiksowany input bar */}
        <div className="h-28" aria-hidden="true" />

        {!isFutureSelected && <ChatInputBar targetDate={selectedDate} variant="fixed" />}
      </div>
    </>
  );
}
