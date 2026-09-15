"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUser, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit } from "@/lib/audit";

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
    | "RC";
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

  await db.insert(users).values({ name, email, passwordHash, role, position, managerId });

  await logAudit(session.userId!, "USER_CREATED", { email, role });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUserActiveAction(userId: string, active: boolean) {
  const session = await requireUser(["ADMIN"]);
  await db.update(users).set({ active }).where(eq(users.id, userId));
  await logAudit(session.userId!, active ? "USER_REACTIVATED" : "USER_DEACTIVATED", { userId });
  revalidatePath("/admin/usuarios");
}
