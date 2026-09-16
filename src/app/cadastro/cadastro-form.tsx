"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { completeProfileAction, type CompleteProfileState } from "./actions";

const initialState: CompleteProfileState = {};

const TIPOS = [
  ["TECNICO", "Técnico"],
  ["RC", "Representante Comercial"],
  ["FUNCIONARIO_BMC", "Funcionário BMC"],
] as const;

export default function CadastroForm() {
  const [state, formAction, pending] = useActionState(completeProfileAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push("/");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nome completo</label>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">CPF</label>
        <input
          name="cpf"
          required
          placeholder="000.000.000-00"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          CNPJ (se for de uma empresa terceirizada)
        </label>
        <input
          name="cnpj"
          placeholder="00.000.000/0000-00 (opcional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <p className="mt-1 text-xs text-gray-400">
          Pode ser o mesmo CNPJ de outra pessoa — várias pessoas da mesma empresa podem usar o
          mesmo CNPJ.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Endereço</label>
        <textarea
          name="address"
          required
          rows={2}
          placeholder="Rua, número, bairro, cidade, estado, CEP"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Qual é o seu vínculo?
        </label>
        <div className="space-y-2">
          {TIPOS.map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="tipo" value={v} required className="accent-[--color-brand]" />
              {l}
            </label>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Concluir cadastro"}
      </button>
    </form>
  );
}
