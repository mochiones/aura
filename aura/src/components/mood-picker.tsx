"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MOOD_ARIA_LABELS, MOOD_COLORS, MOOD_EMOJI, MOODS } from "@/lib/mood";
import type { Mood } from "@/types/entry";

interface MoodPickerProps {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <ToggleGroup
      role="radiogroup"
      aria-label="Wybierz nastrój"
      value={value !== null ? [value.toString()] : []}
      onValueChange={(vals: readonly string[]) => {
        const last = vals[vals.length - 1];
        onChange(last ? (parseInt(last) as Mood) : null);
      }}
      className="gap-2 justify-start"
    >
      {MOODS.map((mood) => (
        <ToggleGroupItem
          key={mood}
          value={mood.toString()}
          aria-label={MOOD_ARIA_LABELS[mood]}
          className="text-2xl h-12 w-12 rounded-xl border border-[#EBEBF0] data-[state=on]:border-[#1A1A2E] transition-all"
          style={
            value === mood
              ? { backgroundColor: MOOD_COLORS[mood] + "40", borderColor: MOOD_COLORS[mood] }
              : {}
          }
        >
          {MOOD_EMOJI[mood]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
