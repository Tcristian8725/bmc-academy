"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import {
  trainings,
  lessons,
  exams,
  questions,
  answers,
  trainingAssignments,
  users,
  progress,
  examAttempts,
  certificates,
  lessonProgress,
  learningPathCourses,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { formatAudienceRoles, syncTrainingAssignments } from "@/lib/assignments";

async function assertAdmin() {
  return requireUser(["ADMIN"]);
}

export async function togglePublishAction(trainingId: string, published: boolean) {
  const session = await assertAdmin();
  await db
    .update(trainings)
    .set({ published, publishedAt: published ? new Date().toISOString() : null })
    .where(eq(trainings.id, trainingId));
  await logAudit(session.userId!, published ? "TRAINING_PUBLISHED" : "TRAINING_UNPUBLISHED", {
    trainingId,
  });
  // Publicar sozinho não deixa o treinamento visível em "Meus treinamentos"
  // de ninguém sem uma atribuição — atribui automaticamente a quem já bate
  // com o público-alvo salvo do treinamento (ver "Público-alvo" na página).
  if (published) {
    await syncTrainingAssignments(trainingId);
  }
  revalidatePath(`/admin/treinamentos/${trainingId}`);
  revalidatePath("/admin/treinamentos");
}

/** Exclui um treinamento por completo (pedido do Telles: retirar o
 * treinamento de exemplo "Introdução à Operação Segura", que era só um
 * seed de teste inicial, nunca um treinamento real). Remove em cascata tudo
 * que depende dele — atribuições, progresso, lições, prova (questões,
 * alternativas, tentativas) e certificados — já que não há FK cascade
 * configurada no schema. Uso geral: serve para qualquer treinamento de
 * teste/rascunho que o admin queira remover, não só este. */
export async function deleteTrainingAction(trainingId: string) {
  const session = await assertAdmin();

  const [exam] = await db.select().from(exams).where(eq(exams.trainingId, trainingId));
  const trainingLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.trainingId, trainingId));
  const lessonIds = trainingLessons.map((l) => l.id);

  // progress.lastLessonId referencia lessons.id — remove antes das lições.
  await db.delete(progress).where(eq(progress.trainingId, trainingId));

  if (exam) {
    const examQuestions = await db.select().from(questions).where(eq(questions.examId, exam.id));
    const questionIds = examQuestions.map((q) => q.id);

    // certificates.examAttemptId referencia exam_attempts.id — remove antes.
    await db.delete(certificates).where(eq(certificates.trainingId, trainingId));
    await db.delete(examAttempts).where(eq(examAttempts.examId, exam.id));
    if (questionIds.length > 0) {
      await db.delete(answers).where(inArray(answers.questionId, questionIds));
    }
    await db.delete(questions).where(eq(questions.examId, exam.id));
    await db.delete(exams).where(eq(exams.trainingId, trainingId));
  } else {
    // Sem prova, ainda pode haver certificado emitido sem tentativa vinculada.
    await db.delete(certificates).where(eq(certificates.trainingId, trainingId));
  }

  if (lessonIds.length > 0) {
    await db.delete(lessonProgress).where(inArray(lessonProgress.lessonId, lessonIds));
  }
  await db.delete(lessons).where(eq(lessons.trainingId, trainingId));
  await db.delete(trainingAssignments).where(eq(trainingAssignments.trainingId, trainingId));
  await db.delete(learningPathCourses).where(eq(learningPathCourses.trainingId, trainingId));
  await db.delete(trainings).where(eq(trainings.id, trainingId));

  await logAudit(session.userId!, "TRAINING_DELETED", { trainingId });

  revalidatePath("/admin/treinamentos");
  redirect("/admin/treinamentos");
}

export async function setAudienceAction(trainingId: string, formData: FormData) {
  const session = await assertAdmin();
  const roles = formData.getAll("audienceRole") as string[];
  const audienceRoles = formatAudienceRoles(roles);

  await db.update(trainings).set({ audienceRoles }).where(eq(trainings.id, trainingId));
  await logAudit(session.userId!, "TRAINING_AUDIENCE_UPDATED", { trainingId, audienceRoles });

  const [training] = await db.select().from(trainings).where(eq(trainings.id, trainingId));
  if (training?.published) {
    await syncTrainingAssignments(trainingId);
  }
  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function addLessonAction(trainingId: string, formData: FormData) {
  await assertAdmin();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "TEXT") as
    | "VIDEO"
    | "PDF"
    | "SLIDES"
    | "LINK"
    | "TEXT";
  const url = String(formData.get("url") || "") || null;
  const content = String(formData.get("content") || "") || null;
  if (!title) return;

  const existing = await db.select().from(lessons).where(eq(lessons.trainingId, trainingId));

  await db
    .insert(lessons)
    .values({ trainingId, title, type, url, content, order: existing.length + 1 });

  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function deleteLessonAction(trainingId: string, lessonId: string) {
  await assertAdmin();
  await db.delete(lessons).where(eq(lessons.id, lessonId));
  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function createExamAction(trainingId: string, formData: FormData) {
  await assertAdmin();
  const title = String(formData.get("title") || "Avaliação");
  const minScorePercent = Number(formData.get("minScorePercent") || 70);
  const maxAttempts = Number(formData.get("maxAttempts") || 3);

  const [existing] = await db.select().from(exams).where(eq(exams.trainingId, trainingId));
  if (existing) return;

  await db.insert(exams).values({ trainingId, title, minScorePercent, maxAttempts });

  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function addQuestionAction(
  trainingId: string,
  examId: string,
  formData: FormData
) {
  await assertAdmin();
  const statement = String(formData.get("statement") || "").trim();
  const type = String(formData.get("type") || "MULTIPLA_ESCOLHA") as
    | "MULTIPLA_ESCOLHA"
    | "VERDADEIRO_FALSO"
    | "MULTIPLA_RESPOSTA"
    | "ASSOCIACAO";
  const explanation = String(formData.get("explanation") || "") || null;

  if (!statement) return;

  const existingQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, examId));

  const [question] = await db
    .insert(questions)
    .values({ examId, type, statement, explanation, order: existingQuestions.length + 1 })
    .returning();

  const answerTexts = formData.getAll("answerText") as string[];
  const correctIndexes = new Set(
    (formData.getAll("answerCorrect") as string[]).map((v) => Number(v))
  );

  const values = answerTexts
    .map((text, i) => ({ text: text.trim(), correct: correctIndexes.has(i), order: i + 1 }))
    .filter((a) => a.text.length > 0);

  if (values.length > 0) {
    await db.insert(answers).values(values.map((v) => ({ questionId: question.id, ...v })));
  }

  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function setCorrectAnswersAction(
  trainingId: string,
  questionId: string,
  formData: FormData
) {
  const session = await assertAdmin();

  const correctIds = new Set(formData.getAll("correctAnswerId") as string[]);

  const existingAnswers = await db.select().from(answers).where(eq(answers.questionId, questionId));

  for (const a of existingAnswers) {
    const shouldBeCorrect = correctIds.has(a.id);
    if (a.correct !== shouldBeCorrect) {
      await db.update(answers).set({ correct: shouldBeCorrect }).where(eq(answers.id, a.id));
    }
  }

  await logAudit(session.userId!, "QUESTION_ANSWER_KEY_UPDATED", { trainingId, questionId });
  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function setQuestionImageAction(
  trainingId: string,
  questionId: string,
  formData: FormData
) {
  const session = await assertAdmin();
  const imageUrl = String(formData.get("imageUrl") || "").trim() || null;
  await db.update(questions).set({ imageUrl }).where(eq(questions.id, questionId));
  await logAudit(session.userId!, "QUESTION_IMAGE_UPDATED", { trainingId, questionId, imageUrl });
  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function deleteQuestionAction(trainingId: string, questionId: string) {
  await assertAdmin();
  await db.delete(answers).where(eq(answers.questionId, questionId));
  await db.delete(questions).where(eq(questions.id, questionId));
  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function assignUserAction(trainingId: string, formData: FormData) {
  const session = await assertAdmin();
  const userId = String(formData.get("userId") || "");
  const required = formData.get("required") === "on";
  if (!userId) return;

  const [existing] = await db
    .select()
    .from(trainingAssignments)
    .where(
      and(eq(trainingAssignments.trainingId, trainingId), eq(trainingAssignments.userId, userId))
    );
  if (existing) return;

  await db
    .insert(trainingAssignments)
    .values({ trainingId, userId, required, assignedBy: session.userId! });

  await logAudit(session.userId!, "TRAINING_ASSIGNED", { trainingId, userId });
  revalidatePath(`/admin/treinamentos/${trainingId}`);
}

export async function unassignUserAction(trainingId: string, assignmentId: string) {
  await assertAdmin();
  await db.delete(trainingAssignments).where(eq(trainingAssignments.id, assignmentId));
  revalidatePath(`/admin/treinamentos/${trainingId}`);
}
