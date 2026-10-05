import { eq, desc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { certificates, users, trainings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTimeBR } from "@/lib/datetime";

export default async function CertificadosPage() {
  await requireUser(["ADMIN"]);

  const rows = await db
    .select({
      code: certificates.code,
      userName: users.name,
      userRole: users.role,
      trainingTitle: trainings.title,
      trainingCode: trainings.code,
      scorePercent: certificates.scorePercent,
      workloadHours: certificates.workloadHours,
      issuedAt: certificates.issuedAt,
    })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
    .where(isNull(users.deletedAt))
    .orderBy(desc(certificates.issuedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Certificados emitidos</h1>
        <p className="text-sm text-gray-500">
          {rows.length} {rows.length === 1 ? "certificado emitido" : "certificados emitidos"}.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Pessoa</th>
              <th className="px-4 py-3">Treinamento</th>
              <th className="px-4 py-3">Nota</th>
              <th className="px-4 py-3">Carga horária</th>
              <th className="px-4 py-3">Emitido em</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhum certificado emitido ainda.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {r.userName}{" "}
                  <span className="text-xs font-normal text-gray-400">({r.userRole})</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.trainingCode} — {r.trainingTitle}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.scorePercent != null ? `${r.scorePercent.toFixed(0)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.workloadHours != null ? `${r.workloadHours}h` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDateTimeBR(r.issuedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/certificados/arquivo/${r.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    Ver PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
