import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listLearningPaths } from "@/lib/learning-paths";
import { createLearningPathAction } from "./actions";

export default async function TrilhasPage() {
  await requireUser(["ADMIN"]);
  const paths = await listLearningPaths();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Trilhas de conhecimento</h1>
        <p className="text-sm text-gray-500">
          Agrupe treinamentos por tema (ex.: Entrega Técnica, Elétrica, Hidráulica). Quem já tem
          o treinamento atribuído passa a vê-lo organizado dentro da trilha, em
          &quot;Trilhas de conhecimento&quot; no painel dele.
        </p>
      </div>

      <details className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
        <summary className="cursor-pointer text-sm font-semibold text-brand">
          + Nova trilha
        </summary>
        <form action={createLearningPathAction} className="mt-3 space-y-3">
          <input
            name="name"
            required
            placeholder="Nome da trilha (ex.: Entrega Técnica)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Descrição (opcional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            Criar trilha
          </button>
        </form>
      </details>

      <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {paths.length === 0 && (
          <p className="p-6 text-sm text-gray-500">Nenhuma trilha criada ainda.</p>
        )}
        {paths.map((p) => (
          <Link
            key={p.id}
            href={`/admin/trilhas/${p.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium text-foreground">{p.name}</p>
              {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
            </div>
            <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {p.courseCount} treinamento{p.courseCount === 1 ? "" : "s"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
