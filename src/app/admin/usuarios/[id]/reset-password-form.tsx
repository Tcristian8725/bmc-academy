"use client";

import { useActionState, useState, startTransition } from "react";
import { resetUserPasswordAction, type ResetPasswordState } from "../actions";

const initialState: ResetPasswordState = {};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function generatePassword(): string {
  // Sem caracteres que se confundem (0/O, 1/l/I) para ficar fácil de ditar.
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function ResetPasswordForm({ userId }: { userId: string }) {
  const action = resetUserPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, initialState);

  // Envia sem o "reset" automático do formulário: se der erro de validação,
  // a pessoa não perde o que já digitou.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nova senha</label>
        <input
          name="newPassword"
          type="text"
          autoComplete="off"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Repetir nova senha</label>
        <input
          name="confirmPassword"
          type="text"
          autoComplete="off"
          minLength={6}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="button"
          onClick={() => {
            const p = generatePassword();
            setPassword(p);
            setConfirm(p);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Gerar senha
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar nova senha"}
        </button>
        {state.success && (
          <span className="text-sm text-emerald-600">
            Senha alterada. Passe a nova senha para o usuário.
          </span>
        )}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
