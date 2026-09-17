"use client";

import { useActionState, useState } from "react";
import { createUserAction, type UserFormState } from "./actions";

const initialState: UserFormState = {};

export default function UserForm({
  managers,
}: {
  managers: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-semibold text-brand hover:underline"
      >
        {open ? "Fechar formulário" : "+ Novo usuário"}
      </button>

      {open && (
        <form action={formAction} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome completo" name="name" required />
          <Field label="E-mail (login)" name="email" type="text" required />
          <Field label="Senha provisória" name="password" type="password" required />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Perfil</label>
            <select
              name="role"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="TECNICO">Técnico</option>
              <option value="RC">RC / Representante Comercial</option>
              <option value="FUNCIONARIO">Funcionário BMC</option>
              <option value="GESTOR">Gestor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <Field label="Cargo / função" name="position" />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Gestor responsável (opcional)
            </label>
            <select
              name="managerId"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">— nenhum —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {state.error && (
            <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="col-span-full rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Usuário criado com sucesso.
            </p>
          )}

          <div className="col-span-full">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
