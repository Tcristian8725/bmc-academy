"use client";

import { useActionState, startTransition } from "react";
import { requestPasswordResetAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <p>
          Se esse e-mail tiver cadastro, enviamos agora um link para você criar uma nova senha.
          Confira a caixa de entrada (e o spam). O link vale por 1 hora.
        </p>
        <p>
          Se o e-mail não chegar, peça a um administrador da BMC Academy para definir uma nova
          senha para você.
        </p>
      </div>
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">E-mail de acesso</label>
        <input
          type="text"
          name="login"
          required
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="email"
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
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar link para criar nova senha"}
      </button>
    </form>
  );
}
