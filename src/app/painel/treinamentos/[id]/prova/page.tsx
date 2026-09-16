import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTrainingForUser, getExamPlayerData } from "@/lib/training-flow";
import ExamForm from "./exam-form";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser(["TECNICO", "RC"]);
  const trainingData = await getTrainingForUser(id, session.userId!);
  if (!trainingData || !trainingData.exam) notFound();

  const examData = await getExamPlayerData(trainingData.exam.id, session.userId!);
  if (!examData) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/painel/treinamentos/${id}`}
          className="text-sm text-brand hover:underline"
        >
          ← {trainingData.training.title}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{examData.exam.title}</h1>
        <p className="text-sm text-gray-500">
          Nota mínima: {examData.exam.minScorePercent}% • Tentativas restantes:{" "}
          {examData.attemptsRemaining} de {examData.exam.maxAttempts}
        </p>
      </div>

      <ExamForm
        examId={examData.exam.id}
        trainingId={id}
        questions={examData.questions}
        attemptsRemaining={examData.attemptsRemaining}
      />
    </div>
  );
}
