"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { MOOD_COLORS, MOOD_EMOJI, MOOD_LABELS } from "@/lib/mood";
import { useEntries } from "@/context/entries-context";
import type { Entry, Mood } from "@/types/entry";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { removeEntry } = useEntries();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!entry) return;
    setIsDeleting(true);
    try {
      await removeEntry(entry.id);
      toast.success("Wpis usunięty");
      router.push("/");
    } catch {
      toast.error("Nie udało się usunąć wpisu. Spróbuj ponownie.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-[#9B9BAD] text-lg mb-4">Wpis nie został znaleziony.</p>
        <Link href="/" className="text-[#1A1A2E] underline text-sm">
          Wróć do listy wpisów
        </Link>
      </div>
    );
  }

  const moodColor = entry.mood ? MOOD_COLORS[entry.mood as Mood] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar – górna belka */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#EBEBF0] bg-[#F7F6F3]/80 backdrop-blur-sm">
        {/* Mobile: przycisk wróć */}
        <Link
          href="/"
          className="md:hidden inline-flex items-center gap-1 text-sm text-[#9B9BAD] hover:text-[#1A1A2E] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Wpisy
        </Link>
        {/* Desktop: pusty element dla wyrównania */}
        <div className="hidden md:block" />

        {/* Akcje po prawej */}
        <div className="flex items-center gap-1">
          <Link
            href={`/entries/${entry.id}/edit`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-8 w-8 p-0 rounded-lg text-[#9B9BAD] hover:text-[#1A1A2E] hover:bg-black/5"
            )}
            aria-label="Edytuj"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-[#9B9BAD] hover:text-destructive hover:bg-destructive/5"
                disabled={isDeleting}
                aria-label="Usuń"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-desc"
            >
              <AlertDialogHeader>
                <AlertDialogTitle id="delete-dialog-title">
                  Usunąć ten wpis?
                </AlertDialogTitle>
                <AlertDialogDescription id="delete-dialog-desc">
                  Czy na pewno chcesz usunąć ten wpis? Tej operacji nie można cofnąć.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-full bg-destructive hover:bg-destructive/90"
                >
                  Usuń wpis
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Treść wpisu */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          {/* Data */}
          <p className="text-sm text-[#9B9BAD] mb-3 capitalize">
            {formatDate(entry.createdAt)}
          </p>

          {/* Nastrój chip */}
          {entry.mood && (
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium mb-4"
              style={{ backgroundColor: moodColor + "30", color: "#1A1A2E" }}
            >
              <span>{MOOD_EMOJI[entry.mood as Mood]}</span>
              <span>{MOOD_LABELS[entry.mood as Mood]}</span>
            </div>
          )}

          {/* Tytuł */}
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-4 leading-tight">
            {entry.title}
          </h1>

          {/* Tagi */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="mb-6" />

          {/* Treść */}
          <TiptapEditor content={entry.content} editable={false} />
        </div>
      </div>
    </div>
  );
}
