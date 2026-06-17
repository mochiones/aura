"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { MoodPicker } from "@/components/mood-picker";
import { TagInput } from "@/components/tag-input";
import { useEntries } from "@/context/entries-context";
import type { Entry, Mood, NewEntry } from "@/types/entry";

interface EntryFormProps {
  entry?: Entry;
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function EntryForm({ entry }: EntryFormProps) {
  const router = useRouter();
  const { addEntry, editEntry } = useEntries();
  const isEditing = !!entry;

  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = "Tytuł jest wymagany";
    if (!content.trim() || content === "<p></p>")
      newErrors.content = "Treść jest wymagana";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const data: NewEntry = {
        title: title.trim(),
        content,
        tags,
        mood,
      };

      if (isEditing) {
        await editEntry(entry.id, data);
        toast.success("Wpis zaktualizowany");
        router.push(`/entries/${entry.id}`);
      } else {
        await addEntry(data);
        toast.success("Wpis zapisany");
        router.push("/");
      }
    } catch {
      toast.error("Nie udało się zapisać wpisu. Spróbuj ponownie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Nagłówek */}
      {!isEditing && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">
            Jak się dziś czujesz?
          </h1>
          <p className="text-sm text-[#9B9BAD] mt-1 capitalize">
            {formatTodayDate()}
          </p>
        </div>
      )}
      {isEditing && (
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">Edytuj wpis</h1>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Mood Picker */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1A1A2E]">Nastrój</Label>
          <MoodPicker value={mood} onChange={setMood} />
        </div>

        {/* Tytuł */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-[#1A1A2E]">
            Tytuł <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            maxLength={120}
            placeholder="Co chcesz zapisać?"
            className={`rounded-xl border-[#EBEBF0] bg-white h-12 text-base ${errors.title ? "border-destructive" : ""}`}
            aria-describedby={errors.title ? "title-error" : undefined}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p id="title-error" className="text-sm text-destructive" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* Treść */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1A1A2E]">
            Treść <span className="text-destructive">*</span>
          </Label>
          <TiptapEditor
            content={content}
            onChange={(html) => {
              setContent(html);
              if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
            }}
            editable
          />
          {errors.content && (
            <p className="text-sm text-destructive" role="alert">
              {errors.content}
            </p>
          )}
        </div>

        {/* Tagi */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1A1A2E]">Tagi</Label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-full bg-[#7C6FCD] hover:bg-[#6B5EBC] text-white h-12 text-base font-medium mt-2"
        >
          {isSaving ? "Zapisywanie…" : isEditing ? "Zapisz zmiany" : "Zapisz wpis"}
        </Button>
      </form>
    </div>
  );
}
