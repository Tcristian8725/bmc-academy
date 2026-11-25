"use client";

import Link from "next/link";
import { useActionState, startTransition } from "react";
import PasswordInput from "@/components/password-input";
import { resetPasswordWithTokenAction, type ResetWithTokenState } from "./actions";

const initialState: ResetWithTokenState = {};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function ResetWithTokenForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordWithTokenAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Senha alterada com sucesso! Agora é só entrar com a nova senha.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Ir para o login
        </Link>
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
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nova senha</label>
        <PasswordInput
          name="newPassword"
          required
          minLength={6}
          autoFocus
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">Pelo menos 6 caracteres.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Repetir nova senha</label>
        <PasswordInput
          name="confirmPassword"
          required
          minLength={6}
          autoComplete="new-password"
          className={inputClass}
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
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
