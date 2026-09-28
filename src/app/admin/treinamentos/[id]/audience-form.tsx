"use client";

// Formulário de "Público-alvo" (rodada 36). Antes era um <form action={...}>
// simples: o salvamento no banco sempre funcionou, mas sem nenhum retorno
// visual — nem "salvando...", nem "salvo!" — então o admin não tinha como
// saber se o clique tinha feito alguma coisa (foi reportado pelo Telles como
// "parece que o botão não está funcionando"). Vira um Client Component só
// pra poder usar useActionState/useFormStatus e mostrar essa confirmação;
// a lógica de salvar continua inteira em actions.ts (Server Action).
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { setAudienceAction, type SetAudienceState } from "./actions";

const initialState: SetAudienceState = { savedAt: null };

function SaveButton() {
    const { pending } = useFormStatus();
    return (
          <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
            {pending ? "Salvando..." : "Salvar público-alvo"}
          </button>
        );
}

export function AudienceForm({
    trainingId,
    options,
    currentAudience,
}: {
    trainingId: string;
    options: readonly (readonly [string, string])[];
    currentAudience: readonly string[];
}) {
    const boundAction = setAudienceAction.bind(null, trainingId);
    const [state, formAction] = useActionState(boundAction, initialState);
    const [showSaved, setShowSaved] = useState(false);
  
    // Confirmação aparece por alguns segundos a cada salvamento novo (savedAt
    // muda) e some sozinha, sem exigir nenhuma ação do admin.
    useEffect(() => {
          if (!state.savedAt) return;
          setShowSaved(true);
          const timer = setTimeout(() => setShowSaved(false), 2500);
          return () => clearTimeout(timer);
    }, [state.savedAt]);
  
    return (
          <form action={formAction} className="mt-3 flex flex-wrap items-center gap-4">
            {options.map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                            type="checkbox"
                                            name="audienceRole"
                                            value={v}
                                            defaultChecked={currentAudience.includes(v)}
                                            className="accent-[--color-brand]"
                                          />
                      {l}
                    </label>
                  ))}
                <SaveButton />
            {showSaved && (
                    <span aria-live="polite" className="text-xs font-medium text-emerald-600">
                              Salvo ✓
                    </span>
                )}
          </form>
        );
}
