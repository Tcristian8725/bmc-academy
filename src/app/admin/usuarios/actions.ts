"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUser, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { assignPublishedTrainingsToUser } from "@/lib/assignments";

export interface UserFormState {
  error?: string;
  success?: boolean;
}

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireUser(["ADMIN"]);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "TECNICO") as
    | "ADMIN"
    | "GESTOR"
    | "TECNICO"
    | "RC"
    | "FUNCIONARIO";
  const position = String(formData.get("position") || "") || null;
  const managerId = String(formData.get("managerId") || "") || null;

  if (!name || !email || !password) {
    return { error: "Preencha nome, e-mail e senha." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres." };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return { error: "Já existe um usuário com este e-mail." };
  }

  const passwordHash = await hashPassword(password);

  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, role, position, managerId })
    .returning();

  await logAudit(session.userId!, "USER_CREATED", { email, role });

  // Pedido do Telles (rodada 14): quem entra já recebe todos os treinamentos
  // publicados que já existem pro perfil dele, sem precisar de atribuição
  // manual uma a uma.
  await assignPublishedTrainingsToUser(created.id, role);

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function updateUserRoleAction(userId: string, formData: FormData) {
  const session = await requireUser(["ADMIN"]);

  if (userId === session.userId) {
    // Evita que o admin logado tire o próprio acesso de administrador por engano.
    return;
  }

  const role = String(formData.get("role") || "") as
    | "ADMIN"
    | "GESTOR"
    | "TECNICO"
    | "RC"
    | "FUNCIONARIO";
  if (!["ADMIN", "GESTOR", "TECNICO", "RC", "FUNCIONARIO"].includes(role)) return;

  await db.update(users).set({ role }).where(eq(users.id, userId));
  await logAudit(session.userId!, "USER_ROLE_CHANGED", { userId, role });

  // Mudou de perfil? Garante que já fique com os treinamentos publicados do
  // novo perfil (nunca remove os que já tinha do perfil anterior).
  await assignPublishedTrainingsToUser(userId, role);

  revalidatePath("/admin/usuarios");
}

export async function toggleUserActiveAction(userId: string, active: boolean) {
  const session = await requireUser(["ADMIN"]);
  await db.update(users).set({ active }).where(eq(users.id, userId));
  await logAudit(session.userId!, active ? "USER_REACTIVATED" : "USER_DEACTIVATED", { userId });
  revalidatePath("/admin/usuarios");
}
