import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { progress as progressTable, users, trainings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTimeBR } from "@/lib/datetime";

const statusLabel: Record<string, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

const STATUS_TABS = [
  ["EM_ANDAMENTO", "Em andamento"],
  ["CONCLUIDO", "Concluídos"],
  ["NAO_INICIADO", "Não iniciados"],
] as const;

const VALID_STATUS = new Set(Object.keys(statusLabel));

export default async function ProgressoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser(["ADMIN"]);
  const { status: statusFilter } = await searchParams;
  const validFilter = statusFilter && VALID_STATUS.has(statusFilter) ? statusFilter : undefined;

  const rows = await db
    .select({
      userName: users.name,
      userRole: users.role,
      trainingTitle: trainings.title,
      trainingCode: trainings.code,
      status: progressTable.status,
      percentComplete: progressTable.percentComplete,
      lastAccessAt: progressTable.lastAccessAt,
      completedAt: progressTable.completedAt,
    })
    .from(progressTable)
    .innerJoin(users, eq(progressTable.userId, users.id))
    .innerJoin(trainings, eq(progressTable.trainingId, trainings.id));

  const countByStatus = (status: string) => rows.filter((r) => r.status === status).length;
  const visibleRows = validFilter ? rows.filter((r) => r.status === validFilter) : rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Progresso dos treinamentos
          {validFilter && <span className="text-gray-400"> — {statusLabel[validFilter]}</span>}
        </h1>
        <p className="text-sm text-gray-500">
          {visibleRows.length}{" "}
          {visibleRows.length === 1 ? "registro encontrado" : "registros encontrados"}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/progresso"
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            !validFilter
              ? "bg-brand text-white"
              : "bg-white text-gray-600 ring-1 ring-black/5 hover:bg-gray-50"
          }`}
        >
          Todos ({rows.length})
        </Link>
        {STATUS_TABS.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/progresso?status=${value}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              validFilter === value
                ? "bg-brand text-white"
                : "bg-white text-gray-600 ring-1 ring-black/5 hover:bg-gray-50"
            }`}
          >
            {label} ({countByStatus(value)})
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Pessoa</th>
              <th className="px-4 py-3">Treinamento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progresso</th>
              <th className="px-4 py-3">Último acesso</th>
              <th className="px-4 py-3">Concluído em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhum registro encontrado{validFilter ? ` com status "${statusLabel[validFilter]}"` : ""}.
                </td>
              </tr>
            )}
            {visibleRows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {r.userName}{" "}
                  <span className="text-xs font-normal text-gray-400">({r.userRole})</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.trainingCode} — {r.trainingTitle}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      r.status === "CONCLUIDO"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "EM_ANDAMENTO"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {statusLabel[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.percentComplete ?? 0}%</td>
                <td className="px-4 py-3 text-gray-500">
                  {r.lastAccessAt ? formatDateTimeBR(r.lastAccessAt) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {r.completedAt ? formatDateTimeBR(r.completedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
