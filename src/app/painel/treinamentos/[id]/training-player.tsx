"use client";

import { useState } from "react";
import Link from "next/link";
import LessonItem from "./lesson-item";

type Lesson = {
  id: string;
  title: string;
  type: string;
  url: string | null;
  content: string | null;
};

// Componente client: existe só para poder reagir na hora quando uma lição
// (em especial o vídeo, ao atingir 70% assistido) fica concluída, sem
// precisar recarregar a página inteira. Antes, a lista de lições e o bloco
// da prova viviam direto no page.tsx (Server Component) — o botão "Iniciar
// prova" só reavaliava se a página fosse recarregada do zero, então o
// técnico terminava o vídeo e a prova continuava aparecendo bloqueada até
// dar F5 (bug relatado pelo Telles).
export default function TrainingPlayer({
  trainingId,
  lessons,
  initialLessonProgress,
  progressStatus,
  exam,
}: {
  trainingId: string;
  lessons: Lesson[];
  initialLessonProgress: Record<string, { watchedPercent: number; completed: boolean }>;
  progressStatus: string;
  exam: { minScorePercent: number; maxAttempts: number } | null;
}) {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const lesson of lessons) {
      map[lesson.id] = Boolean(initialLessonProgress[lesson.id]?.completed);
    }
    return map;
  });

  const allDone =
    progressStatus === "CONCLUIDO" || lessons.every((lesson) => completedMap[lesson.id]);

  return (
    <>
      <div className="space-y-4">
        {lessons.map((lesson) => (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            trainingId={trainingId}
            completed={progressStatus === "CONCLUIDO" || Boolean(completedMap[lesson.id])}
            watchedPercent={initialLessonProgress[lesson.id]?.watchedPercent ?? 0}
            onLessonCompleted={() =>
              setCompletedMap((prev) =>
                prev[lesson.id] ? prev : { ...prev, [lesson.id]: true }
              )
            }
          />
        ))}
      </div>

      {exam && (
        <div className="rounded-xl border border-dashed border-brand/40 bg-brand-light p-5">
          <h2 className="font-semibold text-foreground">Avaliação</h2>
          <p className="mb-3 text-sm text-gray-600">
            {progressStatus === "CONCLUIDO"
              ? "Você já foi aprovado neste treinamento."
              : `Nota mínima para aprovação: ${exam.minScorePercent}%. Tentativas permitidas: ${exam.maxAttempts}.`}
          </p>
          {allDone ? (
            <Link
              href={`/painel/treinamentos/${trainingId}/prova`}
              className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {progressStatus === "CONCLUIDO" ? "Ver prova / certificado" : "Iniciar prova"}
            </Link>
          ) : (
            <span className="inline-block cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-600">
              Assista pelo menos 70% do vídeo (e conclua as demais lições) para liberar a prova
            </span>
          )}
        </div>
      )}
    </>
  );
}
