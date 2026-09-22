"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { userNotifications } from "@/db/schema";

/** Marca uma notificação como lida — só se ela pertencer a quem está
 * logado (evita marcar/ver notificação de outra pessoa pela id). */
export async function markNotificationReadAction(notificationId: string) {
  const session = await requireUser(["TECNICO", "RC", "FUNCIONARIO", "ADMIN", "GESTOR"]);
  await db
    .update(userNotifications)
    .set({ read: true })
    .where(
      and(eq(userNotifications.id, notificationId), eq(userNotifications.userId, session.userId!))
    );
  revalidatePath("/painel");
}

export async function markAllNotificationsReadAction() {
  const session = await requireUser(["TECNICO", "RC", "FUNCIONARIO", "ADMIN", "GESTOR"]);
  await db
    .update(userNotifications)
    .set({ read: true })
    .where(
      and(eq(userNotifications.userId, session.userId!), eq(userNotifications.read, false))
    );
  revalidatePath("/painel");
}
