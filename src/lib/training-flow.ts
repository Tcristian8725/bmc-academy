import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  trainingAssignments,
  trainings,
  lessons,
  lessonProgress,
  progress as progressTable,
  exams,
  questions,
  answers,
  examAttempts,
  certificates,
  users,
} from "@/db/schema";

// Percentual mínimo assistido de um vídeo para a lição contar como concluída
// (a pedido do Telles: sem isso, a prova não libera — ver reportVideoProgress
// e assertLessonsCompletedForExam).
export const WATCH_THRESHOLD_PERCENT = 70;
import { logAudit } from "./audit";
import {
  generateCertificateCode,
  generateCertificatePdf,
  certificatePdfUrl,
} from "./certificate";
import {
  sendNotification,
  certificateApprovedUserEmail,
  certificateApprovedManagerEmail,
} from "./notifications";

export interface AssignmentSummary {
  assignmentId: string;
  trainingId: string;
  title: string;
  category: string;
  workloadHours: number | null;
  required: boolean;
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO";
  percentComplete: number;
}

export async function listAssignmentsForUser(userId: string): Promise<AssignmentSummary[]> {
  const rows = await db
    .select({
      assignmentId: trainingAssignments.id,
      trainingId: trainings.id,
      title: trainings.title,
      category: trainings.category,
      workloadHours: trainings.workloadHours,
      required: trainingAssignments.required,
      status: progressTable.status,
      percentComplete: progressTable.percentComplete,
    })
    .from(trainingAssignments)
    .innerJoin(trainings, eq(trainingAssignments.trainingId, trainings.id))
    .leftJoin(
      progressTable,
      and(eq(progressTable.trainingId, trainings.id), eq(progressTable.userId, userId))
    )
    .where(eq(trainingAssignments.userId, userId));

  return rows.map((r) => ({
    assignmentId: r.assignmentId,
    trainingId: r.trainingId,
    title: r.title,
    category: r.category,
    workloadHours: r.workloadHours,
    required: r.required,
    status: (r.status as AssignmentSummary["status"]) ?? "NAO_INICIADO",
    percentComplete: r.percentComplete ?? 0,
  }));
}

export async function getTrainingForUser(trainingId: string, userId: string) {
  const [training] = await db.select().from(trainings).where(eq(trainings.id, trainingId));
  if (!training) return null;

  const [isAssigned] = await db
    .select()
    .from(trainingAssignments)
    .where(
      and(eq(trainingAssignments.trainingId, trainingId), eq(trainingAssignments.userId, userId))
    );
  if (!isAssigned) return null;

  const trainingLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.trainingId, trainingId))
    .orderBy(lessons.order);

  let [userProgress] = await db
    .select()
    .from(progressTable)
    .where(and(eq(progressTable.trainingId, trainingId), eq(progressTable.userId, userId)));

  if (!userProgress) {
    const [created] = await db
      .insert(progressTable)
      .values({
        userId,
        trainingId,
        status: "NAO_INICIADO",
        percentComplete: 0,
      })
      .returning();
    userProgress = created;
  }

  const [exam] = await db.select().from(exams).where(eq(exams.trainingId, trainingId));

  // filtra pelas lições deste treinamento em memória (sem join) — o número
  // de lições por usuário é sempre pequeno neste protótipo
  const lessonProgressRows = trainingLessons.length
    ? await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId))
    : [];
  const lessonIds = new Set(trainingLessons.map((l) => l.id));
  const lessonProgressMap: Record<string, { watchedPercent: number; completed: boolean }> = {};
  for (const row of lessonProgressRows) {
    if (lessonIds.has(row.lessonId)) {
      lessonProgressMap[row.lessonId] = {
        watchedPercent: row.watchedPercent,
        completed: row.completed,
      };
    }
  }

  return {
    training,
    lessons: trainingLessons,
    progress: userProgress,
    exam,
    lessonProgress: lessonProgressMap,
  };
}

// Recalcula o progresso geral do treinamento (percentComplete/status) a
// partir de quantas lições estão com `completed = true` em lessonProgress —
// substitui o antigo cálculo por "cursor" (lição N vista = lições 1..N
// vistas), que não fazia sentido depois que vídeo passou a exigir assistir
// de verdade (o usuário pode completar as lições fora de ordem).
async function recalcTrainingProgress(userId: string, trainingId: string, lastLessonId?: string) {
  const trainingLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.trainingId, trainingId));
  const total = trainingLessons.length || 1;

  const lessonIds = trainingLessons.map((l) => l.id);
  const progressRows = lessonIds.length
    ? await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId))
    : [];
  const completedCount = progressRows.filter(
    (r) => lessonIds.includes(r.lessonId) && r.completed
  ).length;
  const percent = Math.min(100, Math.round((completedCount / total) * 100));

  let [current] = await db
    .select()
    .from(progressTable)
    .where(and(eq(progressTable.trainingId, trainingId), eq(progressTable.userId, userId)));

  const now = new Date().toISOString();

  if (!current) {
    const [created] = await db
      .insert(progressTable)
      .values({ userId, trainingId, status: "EM_ANDAMENTO", startedAt: now, lastAccessAt: now })
      .returning();
    current = created;
  }

  await db
    .update(progressTable)
    .set({
      status: current.status === "CONCLUIDO" ? "CONCLUIDO" : "EM_ANDAMENTO",
      startedAt: current.startedAt ?? now,
      lastAccessAt: now,
      lastLessonId: lastLessonId ?? current.lastLessonId,
      percentComplete: current.status === "CONCLUIDO" ? 100 : percent,
      updatedAt: now,
    })
    .where(and(eq(progressTable.trainingId, trainingId), eq(progressTable.userId, userId)));
}

// Usado para lições SEM vídeo (TEXT/PDF/LINK/SLIDES) — o botão "Marcar como
// concluída" continua existindo só para essas. Lições de VIDEO são marcadas
// automaticamente por reportVideoProgress ao atingir WATCH_THRESHOLD_PERCENT.
export async function markLessonViewed(userId: string, trainingId: string, lessonId: string) {
  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));

  const now = new Date().toISOString();

  if (existing) {
    await db
      .update(lessonProgress)
      .set({ watchedPercent: 100, completed: true, updatedAt: now })
      .where(eq(lessonProgress.id, existing.id));
  } else {
    await db.insert(lessonProgress).values({
      userId,
      lessonId,
      watchedPercent: 100,
      completed: true,
      updatedAt: now,
    });
  }

  await recalcTrainingProgress(userId, trainingId, lessonId);
}

export interface ReportVideoProgressResult {
  ok: boolean;
  watchedPercent: number;
  completed: boolean;
}

// Chamado periodicamente pelo player (client-side, via YouTube IFrame API)
// com o maior percentual da barra de progresso já alcançado pelo usuário
// (não soma de tempo assistido — dá pra pular pra frente, mas não dá pra
// "marcar como visto" sem tocar no vídeo, que era o problema original).
export async function reportVideoProgress(
  userId: string,
  trainingId: string,
  lessonId: string,
  watchedPercent: number
): Promise<ReportVideoProgressResult> {
  const clamped = Math.max(0, Math.min(100, watchedPercent));

  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));

  const bestPercent = Math.max(clamped, existing?.watchedPercent ?? 0);
  const completed = bestPercent >= WATCH_THRESHOLD_PERCENT;
  const now = new Date().toISOString();

  if (existing) {
    if (bestPercent !== existing.watchedPercent || completed !== existing.completed) {
      await db
        .update(lessonProgress)
        .set({ watchedPercent: bestPercent, completed, updatedAt: now })
        .where(eq(lessonProgress.id, existing.id));
    }
  } else {
    await db.insert(lessonProgress).values({
      userId,
      lessonId,
      watchedPercent: bestPercent,
      completed,
      updatedAt: now,
    });
  }

  await recalcTrainingProgress(userId, trainingId, completed ? lessonId : undefined);

  return { ok: true, watchedPercent: bestPercent, completed };
}

// Confere se TODAS as lições do treinamento estão concluídas (para vídeo,
// significa ter assistido pelo menos WATCH_THRESHOLD_PERCENT%) — usado tanto
// para decidir se mostra o botão "Iniciar prova" quanto, principalmente,
// como trava do lado do servidor em submitExamAttempt (nunca confiar só na
// UI: dá pra acessar a URL da prova direto).
export async function allLessonsCompleted(userId: string, trainingId: string): Promise<boolean> {
  const trainingLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.trainingId, trainingId));
  if (trainingLessons.length === 0) return true;

  const lessonIds = trainingLessons.map((l) => l.id);
  const progressRows = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId));

  const completedIds = new Set(
    progressRows.filter((r) => r.completed).map((r) => r.lessonId)
  );
  return lessonIds.every((id) => completedIds.has(id));
}

// ---------------------------------------------------------------------------
// Provas
// ---------------------------------------------------------------------------

export async function getExamPlayerData(examId: string, userId: string) {
  const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
  if (!exam) return null;

  const examQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, examId))
    .orderBy(questions.order);

  const questionsWithAnswers = [];
  for (const q of examQuestions) {
    const qAnswers = await db.select().from(answers).where(eq(answers.questionId, q.id));
    questionsWithAnswers.push({
      ...q,
      answers: qAnswers.map((a) => ({ id: a.id, text: a.text })), // sem expor "correct"
    });
  }

  const attempts = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.userId, userId)));

  return {
    exam,
    questions: questionsWithAnswers,
    attemptsUsed: attempts.length,
    attemptsRemaining: Math.max(0, exam.maxAttempts - attempts.length),
  };
}

export interface SubmitExamResult {
  ok: boolean;
  error?: string;
  scorePercent?: number;
  passed?: boolean;
  correctByQuestion?: Record<string, string[]>;
  certificateUrl?: string;
}

export async function submitExamAttempt(
  userId: string,
  examId: string,
  responses: Record<string, string[]>
): Promise<SubmitExamResult> {
  const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
  if (!exam) return { ok: false, error: "Prova não encontrada." };

  // Trava do lado do servidor: mesmo que alguém acesse a URL da prova direto
  // (sem passar pela tela do treinamento), não deixa enviar sem ter assistido
  // o vídeo (e concluído as demais lições) primeiro.
  const canTakeExam = await allLessonsCompleted(userId, exam.trainingId);
  if (!canTakeExam) {
    return {
      ok: false,
      error: `É preciso assistir pelo menos ${WATCH_THRESHOLD_PERCENT}% do vídeo (e concluir as demais lições) antes de fazer a prova.`,
    };
  }

  const previousAttempts = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.userId, userId)));

  if (previousAttempts.length >= exam.maxAttempts) {
    return { ok: false, error: "Número máximo de tentativas atingido." };
  }

  const examQuestions = await db.select().from(questions).where(eq(questions.examId, examId));

  let totalPoints = 0;
  let earnedPoints = 0;
  const correctByQuestion: Record<string, string[]> = {};

  for (const q of examQuestions) {
    totalPoints += q.points;
    const qAnswers = await db.select().from(answers).where(eq(answers.questionId, q.id));
    const correctIds = qAnswers.filter((a) => a.correct).map((a) => a.id).sort();
    correctByQuestion[q.id] = correctIds;

    const given = (responses[q.id] ?? []).slice().sort();
    const isCorrect =
      given.length === correctIds.length && given.every((id, i) => id === correctIds[i]);
    if (isCorrect) earnedPoints += q.points;
  }

  const scorePercent = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = scorePercent >= exam.minScorePercent;

  await db.insert(examAttempts).values({
    examId,
    userId,
    attemptNumber: previousAttempts.length + 1,
    submittedAt: new Date().toISOString(),
    scorePercent,
    passed,
    answersJson: JSON.stringify(responses),
  });

  await logAudit(userId, "EXAM_SUBMITTED", { examId, scorePercent, passed });

  let certificateUrl: string | undefined;

  if (passed) {
    certificateUrl = await issueCertificateForTraining(userId, exam.trainingId, scorePercent);
  }

  return {
    ok: true,
    scorePercent,
    passed,
    correctByQuestion: exam.showAnswersAfter ? correctByQuestion : undefined,
    certificateUrl,
  };
}

// ---------------------------------------------------------------------------
// Certificado + comunicação (seções 11 e 12 do Prompt Mestre)
// ---------------------------------------------------------------------------

export async function issueCertificateForTraining(
  userId: string,
  trainingId: string,
  scorePercent: number
): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [training] = await db.select().from(trainings).where(eq(trainings.id, trainingId));

  const now = new Date();
  const completedAtLabel = now.toLocaleDateString("pt-BR");

  // marca progresso como concluído
  await db
    .update(progressTable)
    .set({
      status: "CONCLUIDO",
      percentComplete: 100,
      completedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
    .where(and(eq(progressTable.trainingId, trainingId), eq(progressTable.userId, userId)));

  const code = generateCertificateCode();
  const validationUrl = `${process.env.APP_BASE_URL || "http://localhost:3000"}/certificados/validar/${code}`;

  const pdfBytes = await generateCertificatePdf({
    code,
    userName: user.name,
    trainingTitle: training.title,
    workloadHours: training.workloadHours,
    scorePercent,
    issuedAtLabel: completedAtLabel,
    validationUrl,
  });
  const pdfPath = certificatePdfUrl(code);

  await db.insert(certificates).values({
    userId,
    trainingId,
    code,
    workloadHours: training.workloadHours,
    scorePercent,
    pdfPath,
    pdfData: pdfBytes.toString("base64"),
  });

  await logAudit(userId, "CERTIFICATE_ISSUED", { trainingId, code, scorePercent });

  // Comunicação ao usuário (seção 12)
  const userEmail = certificateApprovedUserEmail({
    userName: user.name,
    trainingTitle: training.title,
    scorePercent,
    completedAt: completedAtLabel,
    certificateUrl: pdfPath,
  });
  await sendNotification({
    toEmail: user.email,
    subject: userEmail.subject,
    body: userEmail.body,
    relatedTrainingId: trainingId,
    relatedUserId: userId,
  });

  // Comunicação aos gestores/administradores — SEM inventar contatos reais (Gisele
  // e demais gestores/admins ainda não informados pelo Telles). Por ora, notifica
  // o gestor direto do usuário quando cadastrado, e sempre registra no NotificationLog
  // para auditoria mesmo quando não há destinatário definido.
  const manager = user.managerId
    ? (await db.select().from(users).where(eq(users.id, user.managerId)))[0]
    : undefined;

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrador",
    GESTOR: "Gestor",
    TECNICO: "Técnico",
    RC: "Representante Comercial",
    FUNCIONARIO: "Funcionário BMC",
  };

  const managerEmail = certificateApprovedManagerEmail({
    managerLabel: manager ? manager.name : "gestores (destinatário A CONFIRMAR)",
    employeeName: user.name,
    employeeRole: roleLabel[user.role] ?? user.role,
    trainingTitle: training.title,
    scorePercent,
    completedAt: completedAtLabel,
  });
  await sendNotification({
    toEmail: manager?.email ?? "gestores-a-confirmar@bmcacademy.local",
    subject: managerEmail.subject,
    body: managerEmail.body,
    relatedTrainingId: trainingId,
    relatedUserId: userId,
  });

  return pdfPath;
}
