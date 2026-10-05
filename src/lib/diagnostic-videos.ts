import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { diagnosticVideos } from "@/db/schema";

/** Todos os vídeos (publicados ou não) — usado só na tela do admin. */
export async function listAllDiagnosticVideos() {
  return db.select().from(diagnosticVideos).orderBy(desc(diagnosticVideos.createdAt));
}

/** Só os publicados — o que Técnico/RC/Funcionário BMC enxerga. */
export async function listPublishedDiagnosticVideos() {
  return db
    .select()
    .from(diagnosticVideos)
    .where(eq(diagnosticVideos.published, true))
    .orderBy(desc(diagnosticVideos.createdAt));
}
