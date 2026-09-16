import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import {
  trainings,
  lessons,
  exams,
  questions,
  answers,
  trainingAssignments,
  users,
} from "@/db/schema";
import {
  togglePublishAction,
  addLessonAction,
  deleteLessonAction,
  createExamAction,
  addQuestionAction,
  setCorrectAnswersAction,
  deleteQuestionAction,
  assignUserAction,
  unassignUserAction,
} from "./actions";

const LESSON_TYPES = [
  ["TEXT", "Texto"],
  ["VIDEO", "Vídeo (URL de embed)"],
  ["PDF", "PDF (URL)"],
  ["SLIDES", "Apresentação (URL)"],
  ["LINK", "Link"],
] as const;

const QUESTION_TYPES = [
  ["MULTIPLA_ESCOLHA", "Múltipla escolha (1 correta)"],
  ["VERDADEIRO_FALSO", "Verdadeiro ou falso"],
  ["MULTIPLA_RESPOSTA", "Múltiplas respostas corretas"],
] as const;

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser(["ADMIN"]);

  const [training] = await db.select().from(trainings).where(eq(trainings.id, id));
  if (!training) notFound();

  const trainingLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.trainingId, id))
    .orderBy(lessons.order);

  const [exam] = await db.select().from(exams).where(eq(exams.trainingId, id));
  const examQuestions = exam
    ? await db.select().from(questions).where(eq(questions.examId, exam.id)).orderBy(questions.order)
    : [];
  const questionAnswers = new Map(
    await Promise.all(
      examQuestions.map(
        async (q) =>
          [q.id, await db.select().from(answers).where(eq(answers.questionId, q.id))] as const
      )
    )
  );

  const assignments = await db
    .select({
      id: trainingAssignments.id,
      userId: trainingAssignments.userId,
      required: trainingAssignments.required,
      userName: users.name,
      userRole: users.role,
    })
    .from(trainingAssignments)
    .innerJoin(users, eq(trainingAssignments.userId, users.id))
    .where(eq(trainingAssignments.trainingId, id));

  const assignedIds = new Set(assignments.map((a) => a.userId));
  const availableUsers = (await db.select().from(users).where(eq(users.active, true))).filter(
    (u) => !assignedIds.has(u.id) && (u.role === "TECNICO" || u.role === "RC")
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {training.code} — {training.title}
          </h1>
          <p className="text-sm text-gray-500">{training.description}</p>
        </div>
        <form action={togglePublishAction.bind(null, id, !training.published)}>
          <button
            type="submit"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              training.published
                ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
                : "bg-brand text-white hover:bg-brand-dark"
            }`}
          >
            {training.published ? "Despublicar" : "Publicar"}
          </button>
        </form>
      </div>

      {/* Conteúdo / Lições */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Conteúdo (lições)</h2>
        <div className="space-y-2">
          {trainingLessons.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {l.order}. {l.title}
                </p>
                <p className="text-xs text-gray-500">{l.type}</p>
              </div>
              <form action={deleteLessonAction.bind(null, id, l.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Remover
                </button>
              </form>
            </div>
          ))}
          {trainingLessons.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma lição adicionada ainda.</p>
          )}
        </div>

        <details className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
          <summary className="cursor-pointer text-sm font-semibold text-brand">
            + Adicionar lição
          </summary>
          <form action={addLessonAction.bind(null, id)} className="mt-3 space-y-3">
            <input
              name="title"
              required
              placeholder="Título da lição"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select name="type" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {LESSON_TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <input
              name="url"
              placeholder="URL (para vídeo/PDF/apresentação/link)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              name="content"
              rows={3}
              placeholder="Texto (quando o tipo for Texto)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              Adicionar
            </button>
          </form>
        </details>
      </section>

      {/* Prova */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Prova</h2>
        {!exam ? (
          <form
            action={createExamAction.bind(null, id)}
            className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <input
              name="title"
              defaultValue={`Avaliação — ${training.title}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Nota mínima (%)</label>
                <input
                  name="minScorePercent"
                  type="number"
                  defaultValue={70}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Tentativas permitidas</label>
                <input
                  name="maxAttempts"
                  type="number"
                  defaultValue={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              Criar prova
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {exam.title} — nota mínima {exam.minScorePercent}%, {exam.maxAttempts} tentativas
            </p>

            {examQuestions.map((q, idx) => {
              const qAnswers = questionAnswers.get(q.id) ?? [];
              const hasGabarito = qAnswers.some((a) => a.correct);
              return (
                <div
                  key={q.id}
                  className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {idx + 1}. {q.statement}{" "}
                      <span className="text-xs text-gray-400">({q.type})</span>
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                          hasGabarito
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {hasGabarito ? "Gabarito definido" : "Gabarito pendente"}
                      </span>
                      <form action={deleteQuestionAction.bind(null, id, q.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">
                          Remover
                        </button>
                      </form>
                    </div>
                  </div>

                  <form
                    action={setCorrectAnswersAction.bind(null, id, q.id)}
                    className="mt-2 space-y-1.5"
                  >
                    {qAnswers.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          name="correctAnswerId"
                          value={a.id}
                          defaultChecked={a.correct}
                          className="accent-[--color-brand]"
                        />
                        {a.text}
                      </label>
                    ))}
                    <button
                      type="submit"
                      className="mt-1 rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      Salvar gabarito
                    </button>
                  </form>
                </div>
              );
            })}

            <details className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
              <summary className="cursor-pointer text-sm font-semibold text-brand">
                + Adicionar questão
              </summary>
              <form
                action={addQuestionAction.bind(null, id, exam.id)}
                className="mt-3 space-y-3"
              >
                <textarea
                  name="statement"
                  required
                  rows={2}
                  placeholder="Enunciado da questão"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                  name="type"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {QUESTION_TYPES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <input
                  name="explanation"
                  placeholder="Explicação (mostrada no feedback, opcional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500">
                  Preencha as alternativas e marque a(s) correta(s):
                </p>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="answerCorrect"
                      value={i}
                      className="accent-[--color-brand]"
                    />
                    <input
                      name="answerText"
                      placeholder={`Alternativa ${i + 1}`}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  Adicionar questão
                </button>
              </form>
            </details>
          </div>
        )}
      </section>

      {/* Atribuições */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Atribuições</h2>
        <div className="space-y-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5"
            >
              <p className="text-sm text-foreground">
                {a.userName} <span className="text-xs text-gray-400">({a.userRole})</span>{" "}
                {a.required ? "" : "— opcional"}
              </p>
              <form action={unassignUserAction.bind(null, id, a.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Remover
                </button>
              </form>
            </div>
          ))}
        </div>

        <form
          action={assignUserAction.bind(null, id)}
          className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5"
        >
          <select
            name="userId"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione um usuário…</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input type="checkbox" name="required" defaultChecked /> obrigatório
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            Atribuir
          </button>
        </form>
      </section>
    </div>
  );
}
