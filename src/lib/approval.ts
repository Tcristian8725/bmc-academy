/**
 * Aprovação de cadastro (rodada 40).
 *
 * Pedido do Telles: quem se cadastra pelo autocadastro público recebe a senha
 * provisória por e-mail, entra e completa o cadastro, mas fica PENDENTE até um
 * administrador (Telles ou Gisely) liberar. Ninguém novo entra direto.
 *
 *  - PENDENTE: cadastro feito, aguardando um admin decidir.
 *  - APROVADO: acesso liberado (único status que entra no painel).
 *  - AGUARDANDO_HOMOLOGACAO: pausado até a pessoa terminar a homologação.
 *  - NAO_HOMOLOGADO: reprovado na homologação — sem acesso.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sendNotification } from "./notifications";

export type ApprovalStatus = "PENDENTE" | "APROVADO" | "AGUARDANDO_HOMOLOGACAO" | "NAO_HOMOLOGADO";

export const APPROVAL_STATUSES: ApprovalStatus[] = [
  "PENDENTE",
  "APROVADO",
  "AGUARDANDO_HOMOLOGACAO",
  "NAO_HOMOLOGADO",
];

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  PENDENTE: "Pendente de aprovação",
  APROVADO: "Aprovado",
  AGUARDANDO_HOMOLOGACAO: "Aguardando homologação",
  NAO_HOMOLOGADO: "Técnico não homologado",
};

export const APPROVAL_COLOR: Record<ApprovalStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  APROVADO: "bg-emerald-100 text-emerald-700",
  AGUARDANDO_HOMOLOGACAO: "bg-sky-100 text-sky-700",
  NAO_HOMOLOGADO: "bg-red-100 text-red-700",
};

export function isApprovalStatus(value: string): value is ApprovalStatus {
  return (APPROVAL_STATUSES as string[]).includes(value);
}

function baseUrl() {
  return process.env.APP_BASE_URL || "";
}

/** Avisa todos os administradores ativos que há um cadastro novo esperando
 * decisão. Melhor esforço: nunca deve quebrar o cadastro da pessoa. */
export async function notifyAdminsPendingSignup(person: { name: string; email: string }) {
  try {
    const admins = await db.select().from(users).where(eq(users.role, "ADMIN"));
    for (const admin of admins) {
      if (!admin.active || !admin.email.includes("@")) continue;
      await sendNotification({
        toEmail: admin.email,
        subject: "BMC Academy: novo cadastro aguardando aprovação",
        body: `Um novo cadastro foi concluído e aguarda sua aprovação:

Nome: ${person.name}
E-mail: ${person.email}

Para aprovar ou reprovar, acesse Admin > Aprovações:
${baseUrl()}/admin/aprovacoes

— BMC Academy`,
      });
    }
  } catch (err) {
    console.error("[approval] falha ao avisar administradores", err);
  }
}

/** Avisa a pessoa por e-mail quando um admin muda o status do cadastro dela. */
export async function notifyUserApprovalChange(
  person: { name: string; email: string },
  status: ApprovalStatus
) {
  try {
    if (!person.email.includes("@")) return;
    const messages: Partial<Record<ApprovalStatus, string>> = {
      APROVADO: `Seu cadastro na BMC Academy foi aprovado! Você já pode acessar seus treinamentos:
${baseUrl()}/login`,
      AGUARDANDO_HOMOLOGACAO: `Seu cadastro na BMC Academy foi aprovado e está aguardando a conclusão da sua homologação. O acesso aos treinamentos será liberado depois disso.`,
      NAO_HOMOLOGADO: `Seu cadastro na BMC Academy consta como técnico não homologado, por isso o acesso aos treinamentos não foi liberado. Em caso de dúvida, fale com a equipe da BMC.`,
    };
    const text = messages[status];
    if (!text) return;
    await sendNotification({
      toEmail: person.email,
      subject: "BMC Academy: atualização do seu cadastro",
      body: `Olá, ${person.name}!

${text}

— BMC Academy`,
    });
  } catch (err) {
    console.error("[approval] falha ao avisar a pessoa", err);
  }
}
