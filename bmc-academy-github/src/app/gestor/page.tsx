import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { users, trainingAssignments, trainings, progress as progressTable } from "@/db/schema";

const statusLabel: Record<string, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

export default async function GestorPage() {
  const session = await requireUser(["GESTOR"]);

  const team = await db.select().from(users).where(eq(users.managerId, session.userId!));

  const rowsPerMember = await Promise.all(
    team.map(async (member) => {
      const assignments = await db
        .select({
          trainingTitle: trainings.title,
          required: trainingAssignments.required,
          status: progressTable.status,
          percentComplete: progressTable.percentComplete,
        })
        .from(trainingAssignments)
        .innerJoin(trainings, eq(trainingAssignments.trainingId, trainings.id))
        .leftJoin(
          progressTable,
          and(
            eq(progressTable.trainingId, trainingAssignments.trainingId),
            eq(progressTable.userId, trainingAssignments.userId)
          )
        )
        .where(eq(trainingAssignments.userId, member.id));

      return assignments.map((a) => ({
        memberName: member.name,
        memberRole: member.role,
        ...a,
      }));
    })
  );
  const rows = rowsPerMember.flat();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Minha equipe</h1>
        <p className="text-sm text-gray-500">
          Acompanhamento de treinamentos atribuídos, em andamento e concluídos.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Colaborador</th>
              <th className="px-4 py-3">Treinamento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Nenhum colaborador vinculado a você ainda.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {r.memberName} <span className="text-xs text-gray-400">({r.memberRole})</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.trainingTitle}</td>
                <td className="px-4 py-3 text-gray-600">
                  {statusLabel[r.status ?? "NAO_INICIADO"]}
                </td>
                <td className="px-4 py-3 text-gray-600">{r.percentComplete ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
