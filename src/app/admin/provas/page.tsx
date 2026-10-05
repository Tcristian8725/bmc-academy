import { and, eq, desc, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, exams, trainings, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTimeBR } from "@/lib/datetime";

export default async function ProvasPage() {
  await requireUser(["ADMIN"]);

  const rows = await db
    .select({
      userName: users.name,
      userRole: users.role,
      trainingTitle: trainings.title,
      trainingCode: trainings.code,
      attemptNumber: examAttempts.attemptNumber,
      scorePercent: examAttempts.scorePercent,
      passed: examAttempts.passed,
      submittedAt: examAttempts.submittedAt,
    })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .innerJoin(trainings, eq(exams.trainingId, trainings.id))
    .innerJoin(users, eq(examAttempts.userId, users.id))
    .where(and(isNotNull(examAttempts.scorePercent), isNull(users.deletedAt)))
    .orderBy(desc(examAttempts.submittedAt));

  const avg =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + (r.scorePercent ?? 0), 0) / rows.length
      : null;
  const approved = rows.filter((r) => r.passed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Notas das provas</h1>
        <p className="text-sm text-gray-500">
          {rows.length} {rows.length === 1 ? "tentativa corrigida" : "tentativas corrigidas"}
          {avg !== null && <> — média geral: {avg.toFixed(0)}%</>}
          {rows.length > 0 && <> — {approved} aprovada(s), {rows.length - approved} reprovada(s)</>}
          .
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Pessoa</th>
              <th className="px-4 py-3">Treinamento</th>
              <th className="px-4 py-3">Tentativa</th>
              <th className="px-4 py-3">Nota</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Enviada em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhuma prova corrigida ainda.
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
                <td className="px-4 py-3 text-gray-600">{r.attemptNumber}ª</td>
                <td className="px-4 py-3 text-gray-600">
                  {r.scorePercent != null ? `${r.scorePercent.toFixed(0)}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      r.passed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {r.passed ? "Aprovado" : "Reprovado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {r.submittedAt ? formatDateTimeBR(r.submittedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
