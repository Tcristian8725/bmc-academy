import Link from "next/link";
import { db } from "@/db";
import { trainings } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export default async function TreinamentosPage() {
  await requireUser(["ADMIN"]);
  const all = await db.select().from(trainings);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Treinamentos</h1>
          <p className="text-sm text-gray-500">
            Crie treinamentos, adicione conteúdo, provas e atribua aos usuários.
          </p>
        </div>
        <Link
          href="/admin/treinamentos/novo"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Novo treinamento
        </Link>
      </div>

      <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {all.length === 0 && (
          <p className="p-6 text-sm text-gray-500">Nenhum treinamento cadastrado ainda.</p>
        )}
        {all.map((t) => (
          <Link
            key={t.id}
            href={`/admin/treinamentos/${t.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium text-foreground">
                {t.code} — {t.title}
              </p>
              <p className="text-xs text-gray-500">{t.category}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                t.published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {t.published ? "Publicado" : "Rascunho"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
