import type { Mood } from "@/types/entry";

export const MOOD_COLORS: Record<Mood, string> = {
  1: "#F2A7A7",
  2: "#F7C59F",
  3: "#C5B8F0",
  4: "#A8D5E2",
  5: "#A8D5B5",
};

export const MOOD_LABELS: Record<Mood, string> = {
  1: "Bardzo zły",
  2: "Zły",
  3: "Neutralny",
  4: "Dobry",
  5: "Bardzo dobry",
};

export const MOOD_EMOJI: Record<Mood, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export const MOOD_ARIA_LABELS: Record<Mood, string> = {
  1: "Bardzo zły nastrój",
  2: "Zły nastrój",
  3: "Neutralny nastrój",
  4: "Dobry nastrój",
  5: "Bardzo dobry nastrój",
};

export const MOODS: Mood[] = [1, 2, 3, 4, 5];
