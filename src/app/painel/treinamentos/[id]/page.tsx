import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTrainingForUser } from "@/lib/training-flow";
import LessonItem from "./lesson-item";

export default async function TrainingPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser(["TECNICO", "RC", "FUNCIONARIO"]);
  const data = await getTrainingForUser(id, session.userId!);

  if (!data) notFound();

  const { training, lessons, progress, exam, lessonProgress } = data;

  const allDone =
    progress.status === "CONCLUIDO" ||
    lessons.every((l) => lessonProgress[l.id]?.completed);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/painel" className="text-sm text-brand hover:underline">
          ← Meus treinamentos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{training.title}</h1>
        <p className="text-sm text-gray-500">{training.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{progress.percentComplete}% concluído</span>
        </div>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            trainingId={training.id}
            completed={
              progress.status === "CONCLUIDO" || Boolean(lessonProgress[lesson.id]?.completed)
            }
            watchedPercent={lessonProgress[lesson.id]?.watchedPercent ?? 0}
          />
        ))}
      </div>

      {exam && (
        <div className="rounded-xl border border-dashed border-brand/40 bg-brand-light p-5">
          <h2 className="font-semibold text-foreground">Avaliação</h2>
          <p className="mb-3 text-sm text-gray-600">
            {progress.status === "CONCLUIDO"
              ? "Você já foi aprovado neste treinamento."
              : `Nota mínima para aprovação: ${exam.minScorePercent}%. Tentativas permitidas: ${exam.maxAttempts}.`}
          </p>
          {allDone ? (
            <Link
              href={`/painel/treinamentos/${training.id}/prova`}
              className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {progress.status === "CONCLUIDO" ? "Ver prova / certificado" : "Iniciar prova"}
            </Link>
          ) : (
            <span className="inline-block cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-600">
              Assista pelo menos 70% do vídeo (e conclua as demais lições) para liberar a prova
            </span>
          )}
        </div>
      )}
    </div>
  );
}
