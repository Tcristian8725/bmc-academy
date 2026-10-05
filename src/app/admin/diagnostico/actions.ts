"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { diagnosticVideos } from "@/db/schema";
import { logAudit } from "@/lib/audit";

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Adiciona um vídeo à biblioteca de diagnóstico (rodada 39). Já nasce
 * publicado — não há prova, certificado nem atribuição por pessoa. */
export async function addDiagnosticVideoAction(formData: FormData) {
  const session = await requireUser(["ADMIN"]);
  const title = String(formData.get("title") || "").trim();
  const videoUrl = String(formData.get("videoUrl") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const topic = String(formData.get("topic") || "").trim() || null;
  if (!title || !isHttpUrl(videoUrl)) return;

  const [created] = await db
    .insert(diagnosticVideos)
    .values({ title, videoUrl, description, topic })
    .returning();
  await logAudit(session.userId!, "DIAGNOSTIC_VIDEO_ADDED", { id: created.id, title });
  revalidatePath("/admin/diagnostico");
  revalidatePath("/painel/diagnostico");
}

/** Publica/oculta um vídeo sem apagá-lo. */
export async function toggleDiagnosticVideoAction(videoId: string, published: boolean) {
  const session = await requireUser(["ADMIN"]);
  await db
    .update(diagnosticVideos)
    .set({ published, updatedAt: new Date().toISOString() })
    .where(eq(diagnosticVideos.id, videoId));
  await logAudit(session.userId!, "DIAGNOSTIC_VIDEO_TOGGLED", { id: videoId, published });
  revalidatePath("/admin/diagnostico");
  revalidatePath("/painel/diagnostico");
}

export async function deleteDiagnosticVideoAction(videoId: string) {
  const session = await requireUser(["ADMIN"]);
  await db.delete(diagnosticVideos).where(eq(diagnosticVideos.id, videoId));
  await logAudit(session.userId!, "DIAGNOSTIC_VIDEO_DELETED", { id: videoId });
  revalidatePath("/admin/diagnostico");
  revalidatePath("/painel/diagnostico");
}
