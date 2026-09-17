import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import UserForm from "./user-form";
import { toggleUserActiveAction, updateUserRoleAction } from "./actions";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  RC: "RC",
  FUNCIONARIO: "Funcionário BMC",
};

const ROLE_OPTIONS = [
  ["TECNICO", "Técnico"],
  ["RC", "RC / Representante Comercial"],
  ["FUNCIONARIO", "Funcionário BMC"],
  ["GESTOR", "Gestor"],
  ["ADMIN", "Administrador"],
] as const;

export default async function UsuariosPage() {
  const session = await requireUser(["ADMIN"]);

  const allUsers = await db.select().from(users);
  const managers = allUsers.filter((u) => u.role === "GESTOR" || u.role === "ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
        <p className="text-sm text-gray-500">
          Cadastro, edição e desativação de usuários (seção 2 do Prompt Mestre).
        </p>
      </div>

      <UserForm managers={managers.map((m) => ({ id: m.id, name: m.name }))} />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Último acesso</th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allUsers.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">
                  {u.id === session.userId ? (
                    roleLabel[u.role] ?? u.role
                  ) : (
                    <form
                      action={updateUserRoleAction.bind(null, u.id)}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                      >
                        {ROLE_OPTIONS.map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Salvar
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    Ver perfil
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleUserActiveAction.bind(null, u.id, !u.active)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      {u.active ? "Desativar" : "Reativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
