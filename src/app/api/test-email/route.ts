/**
 * Rota de teste (protegida pelo mesmo SETUP_TOKEN) para confirmar que o
 * envio real de e-mail via Resend está funcionando, sem depender de nenhum
 * treinamento/prova real — só chama `sendNotification()` (a mesma função
 * usada pelo e-mail de certificado aprovado) com um assunto/corpo de teste.
 *
 * Registra no histórico de notificações (notification_logs) igual a um
 * e-mail real, com o status verdadeiro (ENVIADO/FALHOU/SIMULADO) — útil pra
 * saber, sem adivinhar, se a RESEND_API_KEY está configurada e funcionando.
 *
 * Uso:
 *   https://SEU-APP.vercel.app/api/test-email?token=SEU_TOKEN&email=voce@dominio.com
 */
import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.SETUP_TOKEN;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "SETUP_TOKEN não configurado nas variáveis de ambiente do Vercel." },
      { status: 500 }
    );
  }
  if (token !== expected) {
    return NextResponse.json({ ok: false, error: "Token inválido." }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Parâmetro obrigatório: email." }, { status: 400 });
  }

  const hasProvider = Boolean(process.env.RESEND_API_KEY);

  const result = await sendNotification({
    toEmail: email,
    subject: "Teste de e-mail — BMC Academy",
    body: `Olá!

Este é um e-mail de teste da BMC Academy, para confirmar que o envio de
notificações por e-mail (via Resend) está configurado corretamente.

Se você recebeu esta mensagem, o envio de e-mail de conclusão de
treinamento já está pronto para funcionar de verdade.

— BMC Academy`,
  });

  return NextResponse.json({
    ok: result.ok,
    resendApiKeyConfigured: hasProvider,
    sentTo: email,
    note: hasProvider
      ? result.ok
        ? "E-mail enviado via Resend (verifique a caixa de entrada, e também spam/lixo eletrônico)."
        : "RESEND_API_KEY está configurada, mas o envio falhou — ver detalhes no /admin (histórico de notificações) ou nos logs da Vercel."
      : "RESEND_API_KEY não está configurada — o envio caiu em modo SIMULADO (não foi enviado de verdade).",
  });
}
