"use client";

import { useActionState } from "react";
import { requestAccessAction, type RequestAccessState } from "./actions";

const initialState: RequestAccessState = {};

export default function RequestAccessForm() {
  const [state, formAction, pending] = useActionState(requestAccessAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Enviamos um e-mail com seu login e senha provisória. Confira sua caixa de entrada (e o
        spam) e depois volte para a tela de login.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Seu e-mail</label>
        <input
          type="email"
          name="email"
          required
          placeholder="seu.email@exemplo.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Solicitar acesso"}
      </button>
    </form>
  );
}
