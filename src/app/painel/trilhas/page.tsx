import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listLearningPathsForUser } from "@/lib/learning-paths";

const statusLabel: Record<string, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

const statusColor: Record<string, string> = {
  NAO_INICIADO: "bg-gray-100 text-gray-600",
  EM_ANDAMENTO: "bg-amber-100 text-amber-700",
  CONCLUIDO: "bg-emerald-100 text-emerald-700",
};

export default async function PainelTrilhasPage() {
  const session = await requireUser(["TECNICO", "RC", "FUNCIONARIO"]);
  const paths = await listLearningPathsForUser(session.userId!);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Trilhas de conhecimento</h1>
        <p className="text-sm text-gray-500">
          Seus treinamentos organizados por tema (ex.: Entrega Técnica, Elétrica, Hidráulica).
        </p>
      </div>

      {paths.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
          Nenhuma trilha com treinamentos seus ainda.
        </p>
      )}

      {paths.map((p) => {
        const concluded = p.courses.filter((c) => c.status === "CONCLUIDO").length;
        return (
          <div key={p.id} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{p.name}</h2>
              <p className="text-xs text-gray-500">
                {concluded}/{p.courses.length} concluído(s)
                {p.description ? ` · ${p.description}` : ""}
              </p>
            </div>
            <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              {p.courses.map((c) => (
                <Link
                  key={c.trainingId}
                  href={`/painel/treinamentos/${c.trainingId}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{c.title}</p>
                    <p className="text-xs text-gray-500">
                      {c.required ? "Obrigatório" : "Opcional"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden w-28 sm:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${c.percentComplete}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[c.status]}`}
                    >
                      {statusLabel[c.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
