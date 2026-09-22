import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLearningPathDetail } from "@/lib/learning-paths";
import { trainingCategoryLabel } from "@/lib/categories";
import {
  renameLearningPathAction,
  deleteLearningPathAction,
  addCourseToLearningPathAction,
  removeCourseFromLearningPathAction,
} from "../actions";

export default async function LearningPathDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser(["ADMIN"]);

  const detail = await getLearningPathDetail(id);
  if (!detail) notFound();
  const { path, courses, availableTrainings } = detail;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{path.name}</h1>
          {path.description && <p className="text-sm text-gray-500">{path.description}</p>}
        </div>
        <form action={deleteLearningPathAction.bind(null, id)}>
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Excluir trilha
          </button>
        </form>
      </div>

      <details className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
        <summary className="cursor-pointer text-sm font-semibold text-brand">
          Editar nome/descrição
        </summary>
        <form action={renameLearningPathAction.bind(null, id)} className="mt-3 space-y-3">
          <input
            name="name"
            defaultValue={path.name}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            defaultValue={path.description ?? ""}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            Salvar
          </button>
        </form>
      </details>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Treinamentos nesta trilha</h2>
        <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          {courses.length === 0 && (
            <p className="p-6 text-sm text-gray-500">Nenhum treinamento adicionado ainda.</p>
          )}
          {courses.map((c) => (
            <div key={c.courseId} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {c.order}. {c.code} — {c.title}
                </p>
                <p className="text-xs text-gray-500">
                  {trainingCategoryLabel(c.category)}
                  {!c.published && " · Rascunho (não publicado)"}
                </p>
              </div>
              <form action={removeCourseFromLearningPathAction.bind(null, id, c.courseId)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Remover
                </button>
              </form>
            </div>
          ))}
        </div>

        {availableTrainings.length > 0 ? (
          <form
            action={addCourseToLearningPathAction.bind(null, id)}
            className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <select
              name="trainingId"
              required
              className="min-w-64 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {availableTrainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              + Adicionar
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            Todos os treinamentos cadastrados já estão nesta trilha.
          </p>
        )}
      </section>
    </div>
  );
}
