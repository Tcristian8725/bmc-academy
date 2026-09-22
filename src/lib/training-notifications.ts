/**
 * Notificação de "novo treinamento disponível" — rodada 31, pedido do
 * Telles: "quando a gente colocar um treinamento novo, chegue um e-mail ou
 * uma notificação para o técnico que tem um treinamento novo disponível, o
 * ideal é um e-mail e na própria plataforma".
 *
 * `notifyTrainingAssigned` faz as duas coisas de uma vez, sempre que uma
 * atribuição (training_assignments) passa a existir para alguém:
 *   1. Grava uma notificação em user_notifications, mostrada no sininho da
 *      plataforma (painel do técnico/RC/funcionário) até a pessoa ler.
 *   2. Envia o e-mail equivalente via sendNotification (mesmo mecanismo do
 *      e-mail de certificado aprovado — Resend, com fallback simulado se
 *      RESEND_API_KEY não estiver configurada).
 *
 * Chamada por dois pontos, de propósito (ver comentários em cada um):
 *   - syncTrainingAssignments (src/lib/assignments.ts) — publicar um
 *     treinamento ou mudar seu público-alvo, que é o "colocar um
 *     treinamento novo" que o Telles descreveu.
 *   - assignUserAction (admin/treinamentos/[id]/actions.ts) — admin atribui
 *     manualmente um treinamento já existente a uma pessoa específica.
 * NÃO é chamada por assignPublishedTrainingsToUser (provisionamento em
 * massa ao criar uma conta nova / trocar o papel de alguém) — de propósito,
 * pra não disparar uma enxurrada de e-mails (um por treinamento já
 * publicado) no exato momento em que uma conta nova é criada.
 */
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { userNotifications, trainings, users } from "@/db/schema";
import { sendNotification } from "./notifications";

export async function notifyTrainingAssigned(userId: string, trainingId: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [training] = await db.select().from(trainings).where(eq(trainings.id, trainingId));
  if (!user || !training) return;

  const link = `/painel/treinamentos/${trainingId}`;

  await db.insert(userNotifications).values({
    userId,
    title: "Novo treinamento disponível",
    message: `"${training.title}" já está liberado para você.`,
    link,
    relatedTrainingId: trainingId,
  });

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  await sendNotification({
    toEmail: user.email,
    subject: `Novo treinamento disponível — ${training.title}`,
    body: `Olá, ${user.name}!

Um novo treinamento foi liberado para você na BMC Academy:

"${training.title}"${training.description ? `\n${training.description}` : ""}

Acesse a plataforma para começar:
${baseUrl}${link}

— BMC Academy`,
    relatedTrainingId: trainingId,
    relatedUserId: userId,
  });
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/** Últimas notificações do usuário, mais recente primeiro — usadas no
 * sininho do topo da plataforma (ver TopNav / NotificationBell). */
export async function listNotificationsForUser(
  userId: string,
  limit = 15
): Promise<NotificationItem[]> {
  const rows = await db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    message: r.message,
    link: r.link,
    read: r.read,
    createdAt: r.createdAt,
  }));
}
