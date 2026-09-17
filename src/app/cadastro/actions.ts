"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireLoggedIn } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { assignPublishedTrainingsToUser } from "@/lib/assignments";

export interface CompleteProfileState {
  error?: string;
  success?: boolean;
}

// Mapa do tipo escolhido pela pessoa para o papel de acesso no sistema.
// Os três tipos (Técnico, RC, Funcionário BMC) viram papéis de verdade,
// distintos entre si — usados pra decidir quais treinamentos cada um recebe
// automaticamente (ver src/lib/assignments.ts). Nenhum dos três dá acesso
// de Gestor/Administrador por conta própria: o autocadastro é público e sem
// aprovação de um admin, então elevar pra Gestor/Admin continua sendo feito
// depois, manualmente, em Admin > Usuários.
const TIPO_TO_ROLE = {
  TECNICO: "TECNICO",
  RC: "RC",
  FUNCIONARIO_BMC: "FUNCIONARIO",
} as const;

const TIPO_TO_POSITION_LABEL = {
  TECNICO: "Técnico (autocadastro)",
  RC: "Representante Comercial (autocadastro)",
  FUNCIONARIO_BMC: "Funcionário BMC (autocadastro)",
} as const;

export async function completeProfileAction(
  _prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const session = await requireLoggedIn();

  const name = String(formData.get("name") || "").trim();
  const cpf = String(formData.get("cpf") || "").trim();
  const cnpj = String(formData.get("cnpj") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const tipo = String(formData.get("tipo") || "") as keyof typeof TIPO_TO_ROLE;

  if (!name) {
    return { error: "Informe seu nome completo." };
  }
  if (!cpf) {
    return { error: "Informe seu CPF." };
  }
  if (!address) {
    return { error: "Informe seu endereço." };
  }
  if (!TIPO_TO_ROLE[tipo]) {
    return { error: "Selecione seu tipo de vínculo." };
  }

  const role = TIPO_TO_ROLE[tipo];

  await db
    .update(users)
    .set({
      name,
      cpf,
      cnpj: cnpj || null,
      address,
      position: TIPO_TO_POSITION_LABEL[tipo],
      role,
      profileCompleted: true,
    })
    .where(eq(users.id, session.userId!));

  await logAudit(session.userId!, "PROFILE_COMPLETED", { tipo, role });

  // Pedido do Telles (rodada 14): quem entra já recebe todos os treinamentos
  // publicados que já existem pro perfil escolhido, sem depender de
  // atribuição manual do admin.
  await assignPublishedTrainingsToUser(session.userId!, role);

  const updatedSession = await getSession();
  updatedSession.name = name;
  updatedSession.role = role;
  updatedSession.profileCompleted = true;
  await updatedSession.save();

  return { success: true };
}
