"use client";

import { useTransition } from "react";
import { markLessonViewedAction } from "./actions";
import { toEmbedUrl } from "@/lib/video";

type Lesson = {
  id: string;
  title: string;
  type: string;
  url: string | null;
  content: string | null;
};

export default function LessonItem({
  lesson,
  trainingId,
  viewed,
}: {
  lesson: Lesson;
  trainingId: string;
  viewed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-foreground">{lesson.title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            viewed ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {viewed ? "Visualizada" : "Pendente"}
        </span>
      </div>

      {lesson.type === "TEXT" && (
        <p className="whitespace-pre-line text-sm text-gray-700">{lesson.content}</p>
      )}

      {lesson.type === "VIDEO" && lesson.url && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={toEmbedUrl(lesson.url)}
            className="h-full w-full"
            allowFullScreen
            title={lesson.title}
          />
        </div>
      )}

      {lesson.type === "PDF" && lesson.url && (
        <a
          href={lesson.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Abrir material (PDF) ↗
        </a>
      )}

      {lesson.type === "LINK" && lesson.url && (
        <a
          href={lesson.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Abrir material ↗
        </a>
      )}

      {lesson.type === "SLIDES" && lesson.url && (
        <a
          href={lesson.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Abrir apresentação ↗
        </a>
      )}

      {!viewed && (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              markLessonViewedAction(trainingId, lesson.id);
            })
          }
          className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Marcar como concluída"}
        </button>
      )}
    </div>
  );
}
