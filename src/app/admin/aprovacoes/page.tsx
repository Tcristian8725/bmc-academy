import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTimeBR } from "@/lib/datetime";
import { regionOfUf } from "@/lib/regions";
import { updateApprovalStatusAction, deleteUserAction } from "../usuarios/actions";

const ROLE_LABEL: Record<string, string> = {
  TECNICO: "Técnico",
  RC: "Representante Comercial",
  FUNCIONARIO: "Funcionário BMC",
  ADMIN: "Administrador",
};

/** Tela exclusiva dos administradores para decidir os cadastros novos (rodada 41):
 * lista só quem já concluiu o cadastro e aguarda decisão. */
export default async function AprovacoesPage() {
  await requireUser(["ADMIN"]);

  const waiting = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.approvalStatus, "PENDENTE"),
        eq(users.profileCompleted, true),
        isNull(users.deletedAt)
      )
    )
    .orderBy(asc(users.createdAt));

  const notFinished = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.approvalStatus, "PENDENTE"),
        eq(users.profileCompleted, false),
        isNull(users.deletedAt)
      )
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Aprovações de cadastro</h1>
        <p className="text-sm text-gray-500">
          Novos cadastros aguardando a decisão dos administradores. Ao aprovar, a pessoa entra na
          plataforma e recebe os treinamentos do perfil dela; ela é avisada por e-mail.
        </p>
        {notFinished.length > 0 && (
          <p className="mt-2 text-xs text-gray-400">
            {notFinished.length} pessoa(s) já receberam a senha provisória mas ainda não
            terminaram o cadastro — elas aparecem aqui assim que enviarem.
          </p>
        )}
      </div>

      {waiting.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
          Nenhum cadastro aguardando aprovação.
        </p>
      )}

      <div className="space-y-4">
        {waiting.map((u) => (
          <div key={u.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold text-foreground">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                {ROLE_LABEL[u.role] ?? u.role}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Item label="CPF" value={u.cpf} />
              <Item label="CNPJ (terceiro)" value={u.cnpj || "— (não é terceiro)"} />
              <Item label="Cadastro enviado em" value={u.createdAt ? formatDateTimeBR(u.createdAt) : null} />
              <Item label="Endereço" value={u.address} />
              <Item label="CEP" value={u.cep} />
              <Item
                label="Cidade / UF"
                value={u.city ? `${u.city}${u.state ? ` / ${u.state}` : ""}${u.state ? ` (${regionOfUf(u.state) ?? ""})` : ""}` : null}
              />
            </dl>

            <form
              action={updateApprovalStatusAction.bind(null, u.id)}
              className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4"
            >
              <button
                type="submit"
                name="approvalStatus"
                value="APROVADO"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Aprovar
              </button>
              <button
                type="submit"
                name="approvalStatus"
                value="AGUARDANDO_HOMOLOGACAO"
                className="rounded-lg border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
              >
                Aguardando homologação
              </button>
              <button
                type="submit"
                name="approvalStatus"
                value="NAO_HOMOLOGADO"
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Reprovar (não homologado)
              </button>
            </form>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-gray-400 hover:text-red-600">
                Excluir cadastro
              </summary>
              <form
                action={deleteUserAction.bind(null, u.id)}
                className="mt-2 flex flex-wrap items-center gap-3"
              >
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" name="confirm" value="yes" required />
                  Excluir (fica arquivado; dá para restaurar depois)
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Excluir
                </button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-foreground">{value || "—"}</dd>
    </div>
  );
}
