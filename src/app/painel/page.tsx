import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAssignmentsForUser } from "@/lib/training-flow";

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

export default async function PainelPage() {
  const session = await requireUser(["TECNICO", "RC"]);
  const assignments = await listAssignmentsForUser(session.userId!);

  const concluded = assignments.filter((a) => a.status === "CONCLUIDO").length;
  const pending = assignments.filter((a) => a.status !== "CONCLUIDO").length;
  const overallPercent =
    assignments.length > 0
      ? Math.round(assignments.reduce((s, a) => s + a.percentComplete, 0) / assignments.length)
      : 0;

  const continueItem = assignments.find((a) => a.status === "EM_ANDAMENTO");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Olá, {session.name!.split(" ")[0]}. Bem-vindo à BMC Academy.
        </h1>
        <p className="text-sm text-gray-500">
          Acompanhe seus treinamentos, provas e certificados por aqui.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Atribuídos" value={assignments.length} />
        <StatCard label="Concluídos" value={concluded} />
        <StatCard label="Pendentes" value={pending} />
        <StatCard label="Progresso geral" value={`${overallPercent}%`} />
      </div>

      {continueItem && (
        <Link
          href={`/painel/treinamentos/${continueItem.trainingId}`}
          className="flex items-center justify-between rounded-xl bg-brand px-5 py-4 text-white shadow-sm transition hover:bg-brand-dark"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">Continuar treinamento</p>
            <p className="font-semibold">{continueItem.title}</p>
          </div>
          <span className="text-sm font-medium">Continuar →</span>
        </Link>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Meus treinamentos</h2>
        <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          {assignments.length === 0 && (
            <p className="p-6 text-sm text-gray-500">
              Nenhum treinamento atribuído ainda.
            </p>
          )}
          {assignments.map((a) => (
            <Link
              key={a.assignmentId}
              href={`/painel/treinamentos/${a.trainingId}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{a.title}</p>
                <p className="text-xs text-gray-500">
                  {a.required ? "Obrigatório" : "Opcional"}
                  {a.workloadHours ? ` • ${a.workloadHours}h` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden w-28 sm:block">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${a.percentComplete}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[a.status]}`}
                >
                  {statusLabel[a.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-2xl font-semibold text-brand">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
