"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EntryForm } from "@/components/entry-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Entry } from "@/types/entry";

export default function EditEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/entries/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("fetch_failed");
        const data = (await res.json()) as Entry;
        setEntry(data);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-[#9B9BAD] text-lg mb-4">Wpis nie został znaleziony.</p>
        <button
          onClick={() => router.push("/")}
          className="text-[#1A1A2E] underline text-sm"
        >
          Wróć do listy wpisów
        </button>
      </div>
    );
  }

  return <EntryForm entry={entry} />;
}
