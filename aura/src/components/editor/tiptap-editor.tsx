"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { useVoiceRecorder } from "@/components/voice-recorder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  Mic,
  MicOff,
  Loader2,
  Check,
  Square,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
  onTranscribe?: (text: string) => void;
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  onTranscribe,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        class: editable
          ? "min-h-[200px] outline-none px-4 py-3"
          : "outline-none px-0 py-0",
      },
    },
    immediatelyRender: false,
  });

  const handleTranscribed = (text: string) => {
    if (onTranscribe) {
      onTranscribe(text);
    }
  };

  const { state, seconds, formattedTime, error, startRecording, stopRecording } =
    useVoiceRecorder(handleTranscribed);

  if (!editor) return null;

  if (!editable) {
    return (
      <div className="prose prose-neutral max-w-none">
        <EditorContent editor={editor} />
      </div>
    );
  }

  const addLink = () => {
    const url = window.prompt("URL:");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  const handleMicClick = () => {
    if (state === "idle") startRecording();
    else if (state === "recording") stopRecording();
  };

  const micButtonClass = () => {
    const base = "h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer";
    if (state === "recording") return `${base} bg-red-100 text-red-500 animate-pulse`;
    if (state === "processing") return `${base} bg-amber-50 text-amber-600`;
    if (state === "done") return `${base} bg-green-100 text-green-700`;
    return `${base} bg-indigo-50 text-[#1A1A2E] hover:bg-indigo-100`;
  };

  return (
    <div className="rounded-xl border border-[#EBEBF0] bg-white overflow-hidden">
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Pasek narzędzi edytora"
        className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#EBEBF0] overflow-x-auto"
      >
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Pogrubienie"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Kursywa"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Podkreślenie"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Przekreślenie"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="Nagłówek 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          aria-label="Nagłówek 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label="Lista punktowana"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          aria-label="Lista numerowana"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          aria-label="Cytat"
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          onPressedChange={addLink}
          aria-label="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Cofnij"
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Ponów"
        >
          <Redo className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Przycisk mikrofonu */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={state === "processing"}
          className={micButtonClass()}
          aria-label={
            state === "idle"
              ? "Nagraj głosowo"
              : state === "recording"
              ? "Zatrzymaj nagrywanie"
              : state === "processing"
              ? "Transkrybuję…"
              : "Tekst wstawiony"
          }
        >
          {state === "idle" && <Mic className="h-4 w-4" />}
          {state === "recording" && <MicOff className="h-4 w-4" />}
          {state === "processing" && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {state === "done" && <Check className="h-4 w-4" />}
        </button>

        {/* Badge stanu (desktop) */}
        {state !== "idle" && (
          <span
            className={`hidden md:inline-flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              state === "recording"
                ? "bg-red-100 text-red-700"
                : state === "processing"
                ? "bg-amber-50 text-amber-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {state === "recording" && (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {formattedTime}
              </>
            )}
            {state === "processing" && "Transkrybuję…"}
            {state === "done" && "Tekst wstawiony"}
          </span>
        )}
      </div>

      <EditorContent editor={editor} />

      {/* Error */}
      {error && (
        <p className="px-4 py-2 text-sm text-destructive border-t border-[#EBEBF0]">
          {error}
        </p>
      )}

      {/* Bottom sheet — mobile, tylko podczas nagrywania lub przetwarzania */}
      {(state === "recording" || state === "processing") && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={state === "recording" ? stopRecording : undefined}
          />
          <div className="relative bg-white rounded-t-2xl border-t border-[#EBEBF0] px-5 pt-5 pb-8 safe-area-pb">
            <div className="w-9 h-1 rounded-full bg-[#EBEBF0] mx-auto mb-5" />

            {state === "recording" && (
              <>
                <div
                  className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 animate-pulse"
                  aria-hidden="true"
                >
                  <Mic className="h-7 w-7 text-red-500" />
                </div>
                <p className="text-3xl font-medium text-[#1A1A2E] text-center mb-1 tabular-nums">
                  {formattedTime}
                </p>
                <p className="text-sm text-[#9B9BAD] text-center mb-5">
                  Nagrywanie — mów teraz…
                </p>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-full h-12 rounded-full bg-[#1A1A2E] text-white font-medium text-base flex items-center justify-center gap-2"
                >
                  <Square className="h-4 w-4 fill-white" />
                  Zatrzymaj i transkrybuj
                </button>
              </>
            )}

            {state === "processing" && (
              <>
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="h-7 w-7 text-amber-600 animate-spin" />
                </div>
                <p className="text-base font-medium text-[#1A1A2E] text-center mb-1">
                  Transkrybuję nagranie…
                </p>
                <p className="text-sm text-[#9B9BAD] text-center">
                  To zajmuje kilka sekund
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Timer — mobile, mały badge w toolbarze gdy nagrywamy */}
      {state === "recording" && (
        <div className="md:hidden flex items-center gap-1.5 px-3 py-1.5 border-t border-[#EBEBF0] bg-red-50">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-700 tabular-nums">
            {formattedTime}
          </span>
          <span className="text-xs text-red-500 ml-auto">Nagrywanie…</span>
        </div>
      )}
    </div>
  );
}
