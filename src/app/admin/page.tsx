import Link from "next/link";
import { pool } from "@/db";
import { requireUser } from "@/lib/auth";
import { DIAGNOSTIC_TRAINING_IDS_SQL } from "@/lib/diagnostic-ids";

async function count(table: string): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*)::int as c FROM ${table}`);
  return rows[0].c;
}

export default async function AdminDashboard() {
  await requireUser(["ADMIN"]);

  const { rows: totalUserRows } = await pool.query(
    `SELECT COUNT(*)::int as c FROM users WHERE deleted_at IS NULL`
  );
  const totalUsers: number = totalUserRows[0].c;
  const { rows: tecnicoRows } = await pool.query(
    `SELECT COUNT(*)::int as c FROM users WHERE role = 'TECNICO' AND deleted_at IS NULL`
  );
  const { rows: rcRows } = await pool.query(
    `SELECT COUNT(*)::int as c FROM users WHERE role = 'RC' AND deleted_at IS NULL`
  );
  const { rows: pendingRows } = await pool.query(
    `SELECT COUNT(*)::int as c FROM users WHERE approval_status = 'PENDENTE' AND deleted_at IS NULL`
  );
  const pendingSignups: number = pendingRows[0].c;
  const totalTrainings = await count("trainings");
  const { rows: certRows } = await pool.query(
    `SELECT COUNT(*)::int as c FROM certificates c
     JOIN users u ON u.id = c.user_id WHERE u.deleted_at IS NULL`
  );
  const totalCertificates: number = certRows[0].c;

  const { rows: progressStats } = await pool.query<{ status: string; c: number }>(
    `SELECT p.status, COUNT(*)::int as c FROM progress p
     JOIN users u ON u.id = p.user_id
     WHERE u.deleted_at IS NULL
       AND p.training_id NOT IN ${DIAGNOSTIC_TRAINING_IDS_SQL}
     GROUP BY p.status`
  );

  const byStatus: Record<string, number> = { NAO_INICIADO: 0, EM_ANDAMENTO: 0, CONCLUIDO: 0 };
  for (const row of progressStats) byStatus[row.status] = row.c;

  const { rows: attemptsRows } = await pool.query<{ avg: string | null; total: number }>(
    `SELECT AVG(a.score_percent) as avg, COUNT(*)::int as total FROM exam_attempts a
     JOIN users u ON u.id = a.user_id WHERE u.deleted_at IS NULL`
  );
  const attemptsRow = {
    avg: attemptsRows[0]?.avg ? Number(attemptsRows[0].avg) : null,
    total: attemptsRows[0]?.total ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Painel administrativo</h1>
        <p className="text-sm text-gray-500">Visão geral da BMC Academy</p>
      </div>

      {pendingSignups > 0 && (
        <Link
          href="/admin/aprovacoes"
          className="block rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
        >
          {pendingSignups} {pendingSignups === 1 ? "cadastro aguardando" : "cadastros aguardando"}{" "}
          aprovação — clique para revisar.
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Usuários" value={totalUsers} href="/admin/usuarios" />
        <Stat label="Técnicos" value={tecnicoRows[0].c} href="/admin/usuarios?role=TECNICO" />
        <Stat label="RCs" value={rcRows[0].c} href="/admin/usuarios?role=RC" />
        <Stat label="Treinamentos" value={totalTrainings} href="/admin/treinamentos" />
        <Stat
          label="Em andamento"
          value={byStatus.EM_ANDAMENTO}
          href="/admin/progresso?status=EM_ANDAMENTO"
        />
        <Stat
          label="Concluídos"
          value={byStatus.CONCLUIDO}
          href="/admin/progresso?status=CONCLUIDO"
        />
        <Stat
          label="Certificados emitidos"
          value={totalCertificates}
          href="/admin/certificados"
        />
        <Stat
          label="Média de notas"
          value={attemptsRow.avg ? `${attemptsRow.avg.toFixed(0)}%` : "—"}
          href="/admin/provas"
        />
      </div>

      <p className="text-xs text-gray-400">
        Clique em qualquer número acima para ver a lista detalhada. Filtros por período, filial,
        gestor, equipamento etc. (seção 15 do Prompt Mestre) ficam para uma próxima fase.
      </p>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md hover:ring-brand/30"
    >
      <p className="text-2xl font-semibold text-brand">{value}</p>
      <p className="text-xs text-gray-500 group-hover:text-brand">{label}</p>
    </Link>
  );
}
