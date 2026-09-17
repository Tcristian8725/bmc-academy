"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { markLessonViewed, reportVideoProgress } from "@/lib/training-flow";

export async function markLessonViewedAction(trainingId: string, lessonId: string) {
  const session = await requireUser(["TECNICO", "RC", "FUNCIONARIO"]);
  await markLessonViewed(session.userId!, trainingId, lessonId);
  revalidatePath(`/painel/treinamentos/${trainingId}`);
  revalidatePath("/painel");
}

// Chamado periodicamente pelo player de vídeo (client-side) enquanto o
// usuário assiste — não é um clique manual, é o próprio player reportando
// o quanto já foi assistido. Sem revalidatePath aqui de propósito: seria
// chamado a cada poucos segundos e o player já atualiza sua própria barra de
// progresso localmente; a página só precisa refletir o estado real quando o
// usuário navega/recarrega.
export async function reportVideoProgressAction(
  trainingId: string,
  lessonId: string,
  watchedPercent: number
) {
  const session = await requireUser(["TECNICO", "RC", "FUNCIONARIO"]);
  return reportVideoProgress(session.userId!, trainingId, lessonId, watchedPercent);
}
