import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTrainingForUser } from "@/lib/training-flow";
import TrainingPlayer from "./training-player";

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

      <TrainingPlayer
        trainingId={training.id}
        lessons={lessons}
        initialLessonProgress={lessonProgress}
        progressStatus={progress.status}
        exam={exam ? { minScorePercent: exam.minScorePercent, maxAttempts: exam.maxAttempts } : null}
      />
    </div>
  );
}
