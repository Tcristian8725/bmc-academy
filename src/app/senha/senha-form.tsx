"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

export default function SenhaForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form
      action={formAction}
      className="max-w-md space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Senha atual</label>
        <input
          type="password"
          name="currentPassword"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nova senha</label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={6}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <p className="mt-1 text-xs text-gray-400">Pelo menos 6 caracteres.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Confirmar nova senha</label>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={6}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Senha alterada com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
