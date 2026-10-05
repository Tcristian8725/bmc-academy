import Link from "next/link";
import { pool } from "@/db";
import { requireUser } from "@/lib/auth";
import { DIAGNOSTIC_TRAINING_IDS_SQL } from "@/lib/diagnostic-ids";
import { NO_REGION, REGIONS, UF_REGION, regionOfUf } from "@/lib/regions";

interface UserRow {
  id: string;
  role: string;
  state: string | null;
}

interface TrainingRow {
  state: string | null;
  training_id: string;
  title: string;
  status: string;
  c: number;
}

const roleLabel: Record<string, string> = {
  TECNICO: "Técnicos",
  RC: "RCs",
  FUNCIONARIO: "Funcionários BMC",
};

export default async function RegioesPage({
  searchParams,
}: {
  searchParams: Promise<{ regiao?: string; uf?: string }>;
}) {
  await requireUser(["ADMIN"]);
  const { regiao, uf } = await searchParams;

  // Só contam pessoas aprovadas, nos perfis que fazem treinamentos.
  const { rows: people } = await pool.query<UserRow>(
    `SELECT id, role, state FROM users
     WHERE active = true AND deleted_at IS NULL AND approval_status = 'APROVADO'
       AND role IN ('TECNICO','RC','FUNCIONARIO')`
  );

  const { rows: trainingRows } = await pool.query<TrainingRow>(
    `SELECT u.state AS state, t.id AS training_id, t.title AS title, p.status AS status,
            COUNT(*)::int AS c
     FROM progress p
     JOIN users u ON u.id = p.user_id
     JOIN trainings t ON t.id = p.training_id
     WHERE u.active = true AND u.deleted_at IS NULL AND u.approval_status = 'APROVADO'
       AND p.training_id NOT IN ${DIAGNOSTIC_TRAINING_IDS_SQL}
       AND u.role IN ('TECNICO','RC','FUNCIONARIO')
     GROUP BY u.state, t.id, t.title, p.status`
  );

  const regionFilter = regiao && (REGIONS as readonly string[]).includes(regiao) ? regiao : undefined;
  const ufFilter = uf && uf.toUpperCase() in UF_REGION ? uf.toUpperCase() : undefined;
  const matches = (state: string | null) => {
    if (ufFilter) return (state || "").toUpperCase() === ufFilter;
    if (regionFilter) return regionOfUf(state) === regionFilter;
    return true;
  };

  // Pessoas por UF e por região.
  const byUf = new Map<string, { total: number; byRole: Record<string, number> }>();
  for (const p of people) {
    const key = p.state ? p.state.toUpperCase() : "—";
    const entry = byUf.get(key) ?? { total: 0, byRole: {} };
    entry.total++;
    entry.byRole[p.role] = (entry.byRole[p.role] ?? 0) + 1;
    byUf.set(key, entry);
  }
  const regionTotals = new Map<string, number>();
  for (const [key, v] of byUf) {
    const region = key === "—" ? NO_REGION : regionOfUf(key);
    regionTotals.set(region, (regionTotals.get(region) ?? 0) + v.total);
  }
  const ufRows = Array.from(byUf.entries())
    .filter(([key]) => matches(key === "—" ? null : key))
    .sort((a, b) => b[1].total - a[1].total);

  // Treinamentos mais acessados na seleção atual: "acessado" = a pessoa já
  // iniciou (Em andamento ou Concluído).
  const trainings = new Map<
    string,
    { title: string; started: number; completed: number; assigned: number }
  >();
  for (const r of trainingRows) {
    if (!matches(r.state)) continue;
    const t = trainings.get(r.training_id) ?? {
      title: r.title,
      started: 0,
      completed: 0,
      assigned: 0,
    };
    t.assigned += r.c;
    if (r.status !== "NAO_INICIADO") t.started += r.c;
    if (r.status === "CONCLUIDO") t.completed += r.c;
    trainings.set(r.training_id, t);
  }
  const topTrainings = Array.from(trainings.values()).sort(
    (a, b) => b.started - a.started || b.completed - a.completed
  );

  const withoutAddress = byUf.get("—")?.total ?? 0;
  const selectionLabel = ufFilter
    ? `UF ${ufFilter}`
    : regionFilter
      ? `Região ${regionFilter}`
      : "Todas as regiões";

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      active ? "bg-brand text-white" : "bg-white text-gray-600 ring-1 ring-black/5 hover:bg-gray-50"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Regiões</h1>
        <p className="text-sm text-gray-500">
          Onde estão os técnicos e quais treinamentos são mais acessados em cada região. Considera
          só cadastros aprovados; a região vem do estado (UF) informado no cadastro.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/regioes" className={pill(!regionFilter && !ufFilter)}>
          Todas ({people.length})
        </Link>
        {REGIONS.map((r) => (
          <Link
            key={r}
            href={`/admin/regioes?regiao=${encodeURIComponent(r)}`}
            className={pill(regionFilter === r && !ufFilter)}
          >
            {r} ({regionTotals.get(r) ?? 0})
          </Link>
        ))}
      </div>

      {withoutAddress > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {withoutAddress} {withoutAddress === 1 ? "pessoa ainda não tem" : "pessoas ainda não têm"}{" "}
          estado (UF) informado — cadastros antigos. Complete em Admin &gt; Usuários &gt; Ver perfil
          &gt; Editar dados para entrarem no relatório.
        </p>
      )}

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Pessoas por estado — {selectionLabel}
        </h2>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">UF</th>
                <th className="px-4 py-3">Região</th>
                <th className="px-4 py-3">Técnicos</th>
                <th className="px-4 py-3">RCs</th>
                <th className="px-4 py-3">Funcionários BMC</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ufRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma pessoa aprovada nessa seleção.
                  </td>
                </tr>
              )}
              {ufRows.map(([key, v]) => (
                <tr key={key}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {key === "—" ? (
                      "—"
                    ) : (
                      <Link
                        href={`/admin/regioes?uf=${key}`}
                        className="text-brand hover:underline"
                      >
                        {key}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {key === "—" ? NO_REGION : regionOfUf(key)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.byRole.TECNICO ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600">{v.byRole.RC ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600">{v.byRole.FUNCIONARIO ?? 0}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{v.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Treinamentos mais acessados — {selectionLabel}
        </h2>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Treinamento</th>
                <th className="px-4 py-3">Iniciaram</th>
                <th className="px-4 py-3">Concluíram</th>
                <th className="px-4 py-3">Atribuídos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topTrainings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Nenhum treinamento atribuído nessa seleção.
                  </td>
                </tr>
              )}
              {topTrainings.map((t) => (
                <tr key={t.title}>
                  <td className="px-4 py-3 font-medium text-foreground">{t.title}</td>
                  <td className="px-4 py-3 text-gray-600">{t.started}</td>
                  <td className="px-4 py-3 text-gray-600">{t.completed}</td>
                  <td className="px-4 py-3 text-gray-600">{t.assigned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          &quot;Iniciaram&quot; conta quem já abriu o treinamento (em andamento ou concluído).
          {" "}Perfis incluídos: {Object.values(roleLabel).join(", ")}.
        </p>
      </div>
    </div>
  );
}
