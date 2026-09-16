import { db } from "@/db";
import { notificationLogs } from "@/db/schema";

/**
 * Serviço de notificação por e-mail — seção 13 do Prompt Mestre.
 *
 * Provedor definitivo ainda não decidido para o restante das notificações
 * (aguardando decisão do Telles/BMC) — por padrão, este serviço apenas
 * REGISTRA a notificação (transporte "console/log"), sem enviar de verdade.
 *
 * Envio real via Resend (https://resend.com) já está ligado quando a variável
 * de ambiente RESEND_API_KEY está configurada — usado hoje pelo e-mail de
 * acesso do autocadastro (/solicitar-acesso). Sem a variável configurada,
 * cai automaticamente no modo simulado (SIMULADO), sem quebrar nada.
 */

interface NotificationInput {
  toEmail: string;
  subject: string;
  body: string;
  relatedTrainingId?: string;
  relatedUserId?: string;
}

async function sendViaResend(toEmail: string, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY não configurada" };

  const from = process.env.RESEND_FROM_EMAIL || "BMC Academy <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { ok: false, error: `Resend ${res.status}: ${errText}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendNotification(input: NotificationInput) {
  const hasProvider = Boolean(process.env.RESEND_API_KEY);

  let status: "ENVIADO" | "FALHOU" | "SIMULADO" = "SIMULADO";
  let error: string | undefined;

  if (hasProvider) {
    const result = await sendViaResend(input.toEmail, input.subject, input.body);
    status = result.ok ? "ENVIADO" : "FALHOU";
    error = result.error;
  }

  if (!hasProvider || status === "FALHOU") {
    console.log(`\n[e-mail ${status.toLowerCase()}] Para: ${input.toEmail}`);
    console.log(`Assunto: ${input.subject}`);
    console.log(input.body);
    if (error) console.log(`Erro: ${error}`);
    console.log("---");
  }

  await db.insert(notificationLogs).values({
    toEmail: input.toEmail,
    subject: input.subject,
    body: input.body,
    status,
    error,
    relatedTrainingId: input.relatedTrainingId,
    relatedUserId: input.relatedUserId,
  });

  return { ok: status !== "FALHOU" };
}

export function certificateApprovedUserEmail(params: {
  userName: string;
  trainingTitle: string;
  scorePercent: number;
  completedAt: string;
  certificateUrl: string;
}) {
  return {
    subject: `Parabéns! Você concluiu "${params.trainingTitle}" — BMC Academy`,
    body: `Olá, ${params.userName}!

Parabéns por concluir o treinamento "${params.trainingTitle}" com nota ${params.scorePercent.toFixed(
      0
    )}%, em ${params.completedAt}.

Seu certificado já está disponível para download:
${params.certificateUrl}

Continue acompanhando seus treinamentos na BMC Academy.

— BMC Academy`,
  };
}

export function certificateApprovedManagerEmail(params: {
  managerLabel: string; // ex.: "gestores da equipe" — sem inventar nomes/e-mails reais
  employeeName: string;
  employeeRole: string;
  trainingTitle: string;
  scorePercent: number;
  completedAt: string;
}) {
  return {
    subject: `${params.employeeName} concluiu "${params.trainingTitle}" — BMC Academy`,
    body: `Olá,

Informamos que ${params.employeeName} (${params.employeeRole}) concluiu e foi aprovado(a) no treinamento "${params.trainingTitle}", com nota ${params.scorePercent.toFixed(
      0
    )}%, em ${params.completedAt}.

O certificado está disponível no histórico do colaborador na BMC Academy.

— BMC Academy (notificação automática para ${params.managerLabel})`,
  };
}
