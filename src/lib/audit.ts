import { db } from "@/db";
import { auditLogs } from "@/db/schema";

/** Registra um evento de auditoria (login, CRUD, provas, certificados, comunicações...)
 *  conforme a seção 19 do Prompt Mestre. Nunca deve derrubar o fluxo principal —
 *  falha de log é registrada no console, não propagada. */
export async function logAudit(
  userId: string | null,
  action: string,
  details: Record<string, unknown>
) {
  try {
    await db.insert(auditLogs).values({
      userId: userId ?? undefined,
      action,
      details: JSON.stringify(details),
    });
  } catch (err) {
    console.error("[audit] falha ao registrar log:", err);
  }
}
