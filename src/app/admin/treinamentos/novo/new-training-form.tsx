"use client";

import { useActionState } from "react";
import { createTrainingAction, type TrainingFormState } from "../actions";
import { TRAINING_CATEGORIES } from "@/lib/categories";

const initialState: TrainingFormState = {};

export default function NewTrainingForm() {
  const [state, formAction, pending] = useActionState(createTrainingAction, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Código</label>
        <input
          name="code"
          required
          placeholder="TRN-002"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
        <input
          name="title"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
          <select
            name="category"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {TRAINING_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Carga horária (h)
          </label>
          <input
            name="workloadHours"
            type="number"
            step="0.5"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Instrutor / responsável
        </label>
        <input
          name="instructor"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar e continuar"}
      </button>
    </form>
  );
}
