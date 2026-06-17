"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Entry, Mood, NewEntry } from "@/types/entry";

interface Filters {
  mood: Mood | null;
  tag: string | null;
}

interface EntriesContextValue {
  entries: Entry[];
  filteredEntries: Entry[];
  isLoading: boolean;
  filters: Filters;
  fetchEntries: () => Promise<void>;
  addEntry: (data: NewEntry) => Promise<Entry>;
  editEntry: (id: string, data: Partial<NewEntry>) => Promise<Entry>;
  removeEntry: (id: string) => Promise<void>;
  setMoodFilter: (mood: Mood | null) => void;
  setTagFilter: (tag: string | null) => void;
  clearFilters: () => void;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({ mood: null, tag: null });

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as Entry[];
      setEntries(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEntry = useCallback(async (data: NewEntry): Promise<Entry> => {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error: string };
      throw new Error(err.error);
    }
    const entry = (await res.json()) as Entry;
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const editEntry = useCallback(
    async (id: string, data: Partial<NewEntry>): Promise<Entry> => {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      const updated = (await res.json()) as Entry;
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    []
  );

  const removeEntry = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const err = (await res.json()) as { error: string };
      throw new Error(err.error);
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setMoodFilter = useCallback((mood: Mood | null) => {
    setFilters((f) => ({ ...f, mood }));
  }, []);

  const setTagFilter = useCallback((tag: string | null) => {
    setFilters((f) => ({ ...f, tag }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ mood: null, tag: null });
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filters.mood !== null && e.mood !== filters.mood) return false;
      if (filters.tag !== null && !e.tags.includes(filters.tag)) return false;
      return true;
    });
  }, [entries, filters]);

  return (
    <EntriesContext.Provider
      value={{
        entries,
        filteredEntries,
        isLoading,
        filters,
        fetchEntries,
        addEntry,
        editEntry,
        removeEntry,
        setMoodFilter,
        setTagFilter,
        clearFilters,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries(): EntriesContextValue {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error("useEntries must be used within EntriesProvider");
  return ctx;
}
