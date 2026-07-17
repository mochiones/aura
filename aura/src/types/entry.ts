export type Mood = 1 | 2 | 3 | 4 | 5;

export interface Entry {
  id: string;
  title: string;
  content: string; // HTML from Tiptap
  tags: string[];
  mood: Mood | null;
  createdAt: string; // ISO 8601
  updatedAt: string;
  userId: string | null; // null in Phase 1
}

export type NewEntry = Omit<Entry, "id" | "createdAt" | "updatedAt" | "userId"> & {
  // Opcjonalna data utworzenia (ISO) — pozwala zapisać wpis do przeszłego dnia.
  createdAt?: string;
};
