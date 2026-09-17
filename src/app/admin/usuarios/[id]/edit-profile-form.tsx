"use client";

import { useActionState, useState } from "react";
import { updateUserProfileAction, type UpdateProfileState } from "../actions";

const initialState: UpdateProfileState = {};

export default function EditProfileForm({
  userId,
  initial,
}: {
  userId: string;
  initial: {
    cpf: string | null;
    cnpj: string | null;
    registrationNumber: string | null;
    phone: string | null;
    whatsapp: string | null;
    position: string | null;
    department: string | null;
    address: string | null;
  };
}) {
  const action = updateUserProfileAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-semibold text-brand hover:underline"
      >
        {open ? "Fechar edição" : "Editar dados"}
      </button>

      {open && (
        <form action={formAction} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CPF" name="cpf" defaultValue={initial.cpf} />
          <Field label="CNPJ" name="cnpj" defaultValue={initial.cnpj} />
          <Field label="Matrícula" name="registrationNumber" defaultValue={initial.registrationNumber} />
          <Field label="Telefone" name="phone" defaultValue={initial.phone} />
          <Field label="WhatsApp" name="whatsapp" defaultValue={initial.whatsapp} />
          <Field label="Cargo" name="position" defaultValue={initial.position} />
          <Field label="Departamento" name="department" defaultValue={initial.department} />
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">Endereço</label>
            <input
              name="address"
              defaultValue={initial.address ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? "Salvando..." : "Salvar dados"}
            </button>
            {state.success && (
              <span className="text-sm text-emerald-600">Dados atualizados.</span>
            )}
            {state.error && <span className="text-sm text-red-600">{state.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
