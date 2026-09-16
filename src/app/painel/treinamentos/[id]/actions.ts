"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { markLessonViewed } from "@/lib/training-flow";

export async function markLessonViewedAction(trainingId: string, lessonId: string) {
  const session = await requireUser(["TECNICO", "RC"]);
  await markLessonViewed(session.userId!, trainingId, lessonId);
  revalidatePath(`/painel/treinamentos/${trainingId}`);
  revalidatePath("/painel");
}
