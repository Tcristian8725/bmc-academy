"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { learningPaths, learningPathCourses } from "@/db/schema";
import { logAudit } from "@/lib/audit";

async function assertAdmin() {
  return requireUser(["ADMIN"]);
}

/** Cria uma trilha nova (ex.: "Entrega Técnica", "Elétrica", "Hidráulica")
 * — pedido do Telles, rodada 32. Curadoria manual: a trilha nasce vazia,
 * o admin escolhe os treinamentos na tela de detalhe. */
export async function createLearningPathAction(formData: FormData) {
  const session = await assertAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  if (!name) return;

  const [created] = await db.insert(learningPaths).values({ name, description }).returning();
  await logAudit(session.userId!, "LEARNING_PATH_CREATED", { name });
  revalidatePath("/admin/trilhas");
  redirect(`/admin/trilhas/${created.id}`);
}

export async function renameLearningPathAction(learningPathId: string, formData: FormData) {
  await assertAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  if (!name) return;

  await db.update(learningPaths).set({ name, description }).where(eq(learningPaths.id, learningPathId));
  revalidatePath(`/admin/trilhas/${learningPathId}`);
  revalidatePath("/admin/trilhas");
}

/** Exclui a trilha (só o agrupamento — nunca apaga os treinamentos que
 * estavam dentro dela, nem as atribuições/progresso de ninguém). */
export async function deleteLearningPathAction(learningPathId: string) {
  const session = await assertAdmin();
  await db.delete(learningPathCourses).where(eq(learningPathCourses.learningPathId, learningPathId));
  await db.delete(learningPaths).where(eq(learningPaths.id, learningPathId));
  await logAudit(session.userId!, "LEARNING_PATH_DELETED", { learningPathId });
  revalidatePath("/admin/trilhas");
  redirect("/admin/trilhas");
}

export async function addCourseToLearningPathAction(learningPathId: string, formData: FormData) {
  await assertAdmin();
  const trainingId = String(formData.get("trainingId") || "");
  if (!trainingId) return;

  const [existing] = await db
    .select()
    .from(learningPathCourses)
    .where(
      and(
        eq(learningPathCourses.learningPathId, learningPathId),
        eq(learningPathCourses.trainingId, trainingId)
      )
    );
  if (existing) return;

  const current = await db
    .select()
    .from(learningPathCourses)
    .where(eq(learningPathCourses.learningPathId, learningPathId));

  // requiresPreviousCompleted = false: o pedido do Telles foi só agrupar por
  // tema pra visualização, não travar a ordem — quem quiser essa trava no
  // futuro pode pedir que a gente exponha o campo na UI.
  await db.insert(learningPathCourses).values({
    learningPathId,
    trainingId,
    order: current.length + 1,
    requiresPreviousCompleted: false,
  });
  revalidatePath(`/admin/trilhas/${learningPathId}`);
}

export async function removeCourseFromLearningPathAction(
  learningPathId: string,
  courseId: string
) {
  await assertAdmin();
  await db.delete(learningPathCourses).where(eq(learningPathCourses.id, courseId));
  revalidatePath(`/admin/trilhas/${learningPathId}`);
}
