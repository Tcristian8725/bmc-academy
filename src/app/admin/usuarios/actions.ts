"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { requireUser, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { assignPublishedTrainingsToUser } from "@/lib/assignments";
import { isApprovalStatus, notifyUserApprovalChange } from "@/lib/approval";
import { normalizeUf } from "@/lib/regions";

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
    | "TECNICO"
    | "RC"
    | "FUNCIONARIO";
  const position = String(formData.get("position") || "") || null;

  if (!name || !email || !password) {
    return { error: "Preencha nome, e-mail e senha." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres." };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return {
      error: existing.deletedAt
        ? "Este e-mail pertence a um usuário excluído. Restaure-o em Usuários > Excluídos para ele continuar de onde parou."
        : "Já existe um usuário com este e-mail.",
    };
  }

  const passwordHash = await hashPassword(password);

  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, role, position })
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
    | "TECNICO"
    | "RC"
    | "FUNCIONARIO";
  if (!["ADMIN", "TECNICO", "RC", "FUNCIONARIO"].includes(role)) return;

  await db
    .update(users)
    .set({ role })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));
  await logAudit(session.userId!, "USER_ROLE_CHANGED", { userId, role });

  // Mudou de perfil? Garante que já fique com os treinamentos publicados do
  // novo perfil (nunca remove os que já tinha do perfil anterior).
  await assignPublishedTrainingsToUser(userId, role);

  revalidatePath("/admin/usuarios");
}

export async function toggleUserActiveAction(userId: string, active: boolean) {
  const session = await requireUser(["ADMIN"]);
  // Usuário excluído só volta pela ação "Restaurar".
  await db
    .update(users)
    .set({ active })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));
  await logAudit(session.userId!, active ? "USER_REACTIVATED" : "USER_DEACTIVATED", { userId });
  revalidatePath("/admin/usuarios");
}

/** Muda o status de aprovação do cadastro (Aprovado / Aguardando
 * homologação / Técnico não homologado / Pendente). Só administradores.
 * Ao aprovar, a pessoa já recebe os treinamentos publicados do perfil dela e
 * é avisada por e-mail. Nunca remove atribuições existentes. */
export async function updateApprovalStatusAction(userId: string, formData: FormData) {
  const session = await requireUser(["ADMIN"]);

  // Evita que o admin logado mude o próprio status por engano.
  if (userId === session.userId) return;

  const status = String(formData.get("approvalStatus") || "");
  if (!isApprovalStatus(status)) return;

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target || target.deletedAt || target.approvalStatus === status) return;

  await db.update(users).set({ approvalStatus: status }).where(eq(users.id, userId));
  await logAudit(session.userId!, "USER_APPROVAL_CHANGED", {
    userId,
    from: target.approvalStatus,
    to: status,
  });

  if (status === "APROVADO") {
    await assignPublishedTrainingsToUser(userId, target.role);
  }
  await notifyUserApprovalChange({ name: target.name, email: target.email }, status);

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/aprovacoes");
  revalidatePath(`/admin/usuarios/${userId}`);
}

export interface UpdateProfileState {
  error?: string;
  success?: boolean;
}

/** Edita os dados de cadastro de um usuário (CPF, CNPJ, telefone, etc.) —
 * usado pelo admin em Admin > Usuários > Ver perfil, por exemplo para
 * completar os dados de um técnico com o que já existe em outro sistema
 * (ex.: SAB), sem precisar que a pessoa passe pelo autocadastro. */
export async function updateUserProfileAction(
  userId: string,
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await requireUser(["ADMIN"]);

  const cpf = String(formData.get("cpf") || "").trim() || null;
  const cnpj = String(formData.get("cnpj") || "").trim() || null;
  const registrationNumber = String(formData.get("registrationNumber") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const whatsapp = String(formData.get("whatsapp") || "").trim() || null;
  const position = String(formData.get("position") || "").trim() || null;
  const department = String(formData.get("department") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const cep = String(formData.get("cep") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const rawState = String(formData.get("state") || "").trim();
  const state = normalizeUf(rawState);
  if (rawState && !state) {
    return { error: "UF inválida. Use a sigla do estado (ex.: PA, SP)." };
  }

  await db
    .update(users)
    .set({
      cpf,
      cnpj,
      registrationNumber,
      phone,
      whatsapp,
      position,
      department,
      address,
      cep,
      city,
      state,
    })
    .where(eq(users.id, userId));

  await logAudit(session.userId!, "USER_PROFILE_UPDATED", { userId });

  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

/** "Excluir" usuário (rodada 42): ARQUIVA, não apaga. Todo o histórico da
 * pessoa (progresso, aulas assistidas, provas, certificados, atribuições,
 * notificações) continua guardado no banco, só que oculto das listas e dos
 * números do admin, e a pessoa não consegue mais entrar. Quem foi excluído
 * pode voltar no futuro e continuar de onde parou — ver restoreUserAction.
 * Só administrador, exige a confirmação marcada, e nunca deixa excluir a
 * própria conta nem o último administrador ativo. */
export async function deleteUserAction(userId: string, formData: FormData) {
  const session = await requireUser(["ADMIN"]);

  if (formData.get("confirm") !== "yes") return;
  if (userId === session.userId) return;

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target || target.deletedAt) return;

  if (target.role === "ADMIN") {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "ADMIN"), eq(users.active, true), isNull(users.deletedAt)));
    if (admins.filter((a) => a.id !== userId).length === 0) return;
  }

  // Mantém approvalStatus e todo o resto como está: ao restaurar, a pessoa
  // volta exatamente na situação em que estava.
  await db
    .update(users)
    .set({ deletedAt: new Date().toISOString(), active: false })
    .where(eq(users.id, userId));

  await logAudit(session.userId!, "USER_DELETED", {
    userId,
    name: target.name,
    email: target.email,
    role: target.role,
    archived: true,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/aprovacoes");
  redirect("/admin/usuarios");
}

/** Traz de volta um usuário excluído: reativa o acesso e o histórico volta a
 * aparecer, então a pessoa continua de onde parou. Treinamentos publicados
 * enquanto ela estava fora são atribuídos (nunca remove nada). */
export async function restoreUserAction(userId: string) {
  const session = await requireUser(["ADMIN"]);

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target || !target.deletedAt) return;

  await db.update(users).set({ deletedAt: null, active: true }).where(eq(users.id, userId));
  await logAudit(session.userId!, "USER_RESTORED", {
    userId,
    name: target.name,
    email: target.email,
  });

  if (target.approvalStatus === "APROVADO") {
    await assignPublishedTrainingsToUser(userId, target.role);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/aprovacoes");
  revalidatePath(`/admin/usuarios/${userId}`);
  redirect(`/admin/usuarios/${userId}`);
}
