"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
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
} from "@/db/schema";
import { logAudit } from "@/lib/audit";

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
  revalidatePath(`/admin/treinamentos/${trainingId}`);
  revalidatePath("/admin/treinamentos");
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
