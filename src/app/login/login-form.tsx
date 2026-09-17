"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          E-mail ou login
        </label>
        <input
          type="text"
          name="email"
          required
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="seu.email@exemplo.com ou seu login"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          type="password"
          name="password"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
