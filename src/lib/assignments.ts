/**
 * Atribuição automática de treinamentos por público-alvo (rodada 14).
 *
 * Pedido do Telles: "a todos que entrarem deixa todos os treinamentos
 * liberados, e aí quando a gente for colocar um treinamento novo vc me
 * pergunta se é para técnico, Rc ou funcionário BMC".
 *
 * Cada treinamento guarda em `audienceRoles` (texto separado por vírgula,
 * ex.: "TECNICO,RC") quais papéis de usuário devem recebê-lo automaticamente.
 * Duas direções de sincronização, ambas idempotentes (nunca duplicam e nunca
 * removem uma atribuição já existente):
 *   - syncTrainingAssignments: dado um treinamento (ex.: acabou de publicar
 *     ou mudou o público-alvo), garante que todo usuário ativo cujo papel
 *     bate com o público-alvo tenha a atribuição.
 *   - assignPublishedTrainingsToUser: dado um usuário (ex.: acabou de ser
 *     criado, ou completou o autocadastro), garante que ele receba todos os
 *     treinamentos já publicados cujo público-alvo bate com o papel dele.
 */
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { trainings, trainingAssignments, users } from "@/db/schema";
import { notifyTrainingAssigned } from "./training-notifications";

export const AUDIENCE_ROLES = ["TECNICO", "RC", "FUNCIONARIO"] as const;
export type AudienceRole = (typeof AUDIENCE_ROLES)[number];

export function parseAudienceRoles(value: string | null | undefined): AudienceRole[] {
  return (value || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is AudienceRole => (AUDIENCE_ROLES as readonly string[]).includes(s));
}

export function formatAudienceRoles(roles: string[]): string {
  const valid = roles
    .map((r) => r.trim().toUpperCase())
    .filter((s) => (AUDIENCE_ROLES as readonly string[]).includes(s));
  // Nunca deixa vazio — sem público-alvo, o treinamento nunca seria atribuído
  // a ninguém automaticamente, o que quase certamente não é a intenção.
  return valid.length > 0 ? valid.join(",") : "TECNICO,RC";
}

/** Garante que todo usuário ativo cujo papel bate com o público-alvo do
 * treinamento tenha uma atribuição (obrigatória). Retorna quantas foram
 * criadas agora. */
export async function syncTrainingAssignments(trainingId: string): Promise<number> {
  const [training] = await db.select().from(trainings).where(eq(trainings.id, trainingId));
  if (!training) return 0;

  const audience = parseAudienceRoles(training.audienceRoles);
  if (audience.length === 0) return 0;

  const targetUsers = await db
    .select()
    .from(users)
    .where(and(inArray(users.role, audience), eq(users.active, true)));

  const existingAssignments = await db
    .select()
    .from(trainingAssignments)
    .where(eq(trainingAssignments.trainingId, trainingId));
  const alreadyAssignedUserIds = new Set(existingAssignments.map((a) => a.userId));

  let assignedCount = 0;
  for (const u of targetUsers) {
    if (alreadyAssignedUserIds.has(u.id)) continue;
    await db.insert(trainingAssignments).values({
      trainingId,
      userId: u.id,
      required: true,
    });
    assignedCount++;
    // Pedido do Telles (rodada 31): quem passa a ter o treinamento novo
    // recebe e-mail + notificação na plataforma. Este é o ponto que cobre
    // "colocar um treinamento novo" (publicar / mudar público-alvo) para
    // gente que já tinha conta — ver training-notifications.ts.
    await notifyTrainingAssigned(u.id, trainingId);
  }
  return assignedCount;
}

/** Garante que o usuário receba todos os treinamentos já publicados cujo
 * público-alvo bate com o papel dele. Retorna quantos foram criados agora. */
export async function assignPublishedTrainingsToUser(
  userId: string,
  role: string
): Promise<number> {
  if (!(AUDIENCE_ROLES as readonly string[]).includes(role)) return 0;
  const audienceRole = role as AudienceRole;

  const publishedTrainings = await db
    .select()
    .from(trainings)
    .where(eq(trainings.published, true));

  const matching = publishedTrainings.filter((t) =>
    parseAudienceRoles(t.audienceRoles).includes(audienceRole)
  );
  if (matching.length === 0) return 0;

  const existingAssignments = await db
    .select()
    .from(trainingAssignments)
    .where(eq(trainingAssignments.userId, userId));
  const alreadyAssignedTrainingIds = new Set(existingAssignments.map((a) => a.trainingId));

  // De propósito, SEM notifyTrainingAssigned aqui: isso rodaria pra cada
  // treinamento já publicado de uma vez (conta nova / troca de papel),
  // disparando uma enxurrada de e-mails só por causa do provisionamento
  // inicial — o pedido do Telles era sobre avisar quando um treinamento
  // NOVO é colocado, não sobre o catálogo inteiro que a pessoa já ganha ao
  // entrar (ver notifyTrainingAssigned em training-notifications.ts).
  let assignedCount = 0;
  for (const t of matching) {
    if (alreadyAssignedTrainingIds.has(t.id)) continue;
    await db.insert(trainingAssignments).values({
      trainingId: t.id,
      userId,
      required: true,
    });
    assignedCount++;
  }
  return assignedCount;
}

/** Rotina de manutenção (chamada pelo /api/setup): garante que todo mundo já
 * cadastrado esteja com os treinamentos publicados em dia, cobrindo contas
 * criadas antes desta funcionalidade existir (ex.: alguém criado depois de um
 * treinamento já ter sido publicado, que nunca recebeu a atribuição). */
export async function syncAllPublishedTrainingAssignments(): Promise<string> {
  const publishedTrainings = await db
    .select()
    .from(trainings)
    .where(eq(trainings.published, true));

  let total = 0;
  for (const t of publishedTrainings) {
    total += await syncTrainingAssignments(t.id);
  }
  return `Sincronização de atribuições: ${total} nova(s) atribuição(ões) criada(s) em ${publishedTrainings.length} treinamento(s) publicado(s).`;
}
