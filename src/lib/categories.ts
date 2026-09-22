/**
 * Lista única de categorias de treinamento — usada tanto pra validar/salvar
 * (`schema.ts`, `actions.ts`) quanto pra exibir o rótulo em português
 * (formulários, listas). Antes existiam duas listas soltas e divergentes
 * (`admin/treinamentos/actions.ts` e `new-training-form.tsx`) — centralizado
 * aqui pra evitar que uma fique desatualizada em relação à outra.
 *
 * `ENTREGA_TECNICA` adicionada na rodada 32 (pedido do Telles: trilha de
 * conhecimento por tema, com "Entrega Técnica" como primeiro exemplo) — as 8
 * provas reais importadas (códigos `ENTREGA-...`) são recategorizadas de
 * "Técnico" para esta categoria nova (ver `recategorizeEntregaTecnica` em
 * `src/db/seed-safe.ts`, rodada via `/api/setup`).
 */

export const TRAINING_CATEGORY_VALUES = [
  "PRODUTO",
  "TECNICO",
  "ENTREGA_TECNICA",
  "MANUTENCAO",
  "DIAGNOSTICO",
  "HIDRAULICA",
  "ELETRICA",
  "MOTOR",
  "OPERACAO",
  "APLICACAO",
  "SEGURANCA",
  "COMERCIAL",
  "POS_VENDAS",
] as const;

export type TrainingCategory = (typeof TRAINING_CATEGORY_VALUES)[number];

export const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  PRODUTO: "Produto",
  TECNICO: "Técnico",
  ENTREGA_TECNICA: "Entrega Técnica",
  MANUTENCAO: "Manutenção",
  DIAGNOSTICO: "Diagnóstico",
  HIDRAULICA: "Hidráulica",
  ELETRICA: "Elétrica",
  MOTOR: "Motor",
  OPERACAO: "Operação",
  APLICACAO: "Aplicação",
  SEGURANCA: "Segurança",
  COMERCIAL: "Comercial",
  POS_VENDAS: "Pós-vendas",
};

export const TRAINING_CATEGORIES: readonly [TrainingCategory, string][] = TRAINING_CATEGORY_VALUES.map(
  (value) => [value, TRAINING_CATEGORY_LABELS[value]]
);

export function trainingCategoryLabel(value: string): string {
  return (TRAINING_CATEGORY_LABELS as Record<string, string>)[value] ?? value;
}
