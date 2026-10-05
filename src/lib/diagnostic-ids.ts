import { pool } from "@/db";

/**
 * Os vídeos da trilha "Vídeos de Diagnóstico" (qualquer trilha cujo nome
 * contenha "diagn") ficam no menu Diagnóstico e NÃO contam como treinamento
 * (pedido do Telles, rodada 42): não entram em "Pendentes", no progresso, nas
 * trilhas do técnico nem nos relatórios.
 */

/** Trecho SQL (para consultas cruas) que lista os ids dos treinamentos de diagnóstico. */
export const DIAGNOSTIC_TRAINING_IDS_SQL = `(
  SELECT lpc.training_id FROM learning_path_courses lpc
  JOIN learning_paths lp ON lp.id = lpc.learning_path_id
  WHERE lp.name ILIKE '%diagn%'
)`;

/** Ids dos treinamentos que pertencem a trilhas de diagnóstico. */
export async function getDiagnosticTrainingIds(): Promise<Set<string>> {
  try {
    const { rows } = await pool.query<{ training_id: string }>(
      `SELECT DISTINCT training_id FROM ${DIAGNOSTIC_TRAINING_IDS_SQL} d`
    );
    return new Set(rows.map((r) => r.training_id));
  } catch {
    return new Set();
  }
}
