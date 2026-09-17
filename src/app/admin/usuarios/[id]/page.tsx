import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { users, branches, certificates, trainings } from "@/db/schema";
import { listAssignmentsForUser } from "@/lib/training-flow";
import EditProfileForm from "./edit-profile-form";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  RC: "Representante Comercial",
  FUNCIONARIO: "Funcionário BMC",
};

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

export default async function PerfilUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["ADMIN"]);
  const { id } = await params;

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) notFound();

  const branch = user.branchId
    ? (await db.select().from(branches).where(eq(branches.id, user.branchId)))[0]
    : null;

  const assignments = await listAssignmentsForUser(user.id);

  const certRows = await db
    .select({
      trainingId: certificates.trainingId,
      code: certificates.code,
      scorePercent: certificates.scorePercent,
      issuedAt: certificates.issuedAt,
      trainingTitle: trainings.title,
    })
    .from(certificates)
    .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
    .where(eq(certificates.userId, user.id));
  const certByTraining = new Map(certRows.map((c) => [c.trainingId, c]));

  const concluded = assignments.filter((a) => a.status === "CONCLUIDO").length;
  const pending = assignments.filter((a) => a.status !== "CONCLUIDO").length;
  const scores = certRows.map((c) => c.scorePercent).filter((s): s is number => s != null);
  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/usuarios" className="text-sm text-gray-500 hover:underline">
          ← Voltar para Usuários
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Perfil do usuário</h1>
        <p className="text-sm text-gray-500">
          Dados de cadastro e habilidades (treinamentos e provas concluídos) na BMC Academy.
        </p>
      </div>

      {/* Dados pessoais */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Dados</h2>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              user.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {user.active ? "Ativo" : "Inativo"}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome completo" value={user.name} />
          <Field label="Login" value={user.email} />
          <Field label="Perfil" value={roleLabel[user.role] ?? user.role} />
          <Field label="CPF" value={user.cpf} />
          <Field label="CNPJ" value={user.cnpj} />
          <Field label="Matrícula" value={user.registrationNumber} />
          <Field label="Telefone" value={user.phone} />
          <Field label="WhatsApp" value={user.whatsapp} />
          <Field label="Cargo" value={user.position} />
          <Field label="Departamento" value={user.department} />
          <Field label="Filial" value={branch?.name ?? null} />
          <Field label="Endereço" value={user.address} />
          <Field
            label="Cadastro"
            value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : null}
          />
          <Field
            label="Último acesso"
            value={
              user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("pt-BR") : "Nunca acessou"
            }
          />
        </dl>

        <EditProfileForm
          userId={user.id}
          initial={{
            cpf: user.cpf,
            cnpj: user.cnpj,
            registrationNumber: user.registrationNumber,
            phone: user.phone,
            whatsapp: user.whatsapp,
            position: user.position,
            department: user.department,
            address: user.address,
          }}
        />
      </div>

      {/* Habilidades / treinamentos */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Habilidades (treinamentos e provas)
        </h2>

        <div className="mb-5 grid grid-cols-3 gap-4 sm:max-w-md">
          <StatCard label="Concluídos" value={concluded} />
          <StatCard label="Pendentes" value={pending} />
          <StatCard label="Nota média" value={avgScore != null ? `${avgScore}%` : "—"} />
        </div>

        <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
          {assignments.length === 0 && (
            <p className="p-4 text-sm text-gray-500">Nenhum treinamento atribuído ainda.</p>
          )}
          {assignments.map((a) => {
            const cert = certByTraining.get(a.trainingId);
            return (
              <div key={a.assignmentId} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-gray-500">
                    {a.required ? "Obrigatório" : "Opcional"}
                    {cert
                      ? ` • Nota ${cert.scorePercent?.toFixed(0)}% • Certificado emitido em ${new Date(
                          cert.issuedAt
                        ).toLocaleDateString("pt-BR")}`
                      : ""}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center ring-1 ring-black/5">
      <p className="text-xl font-semibold text-brand">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
