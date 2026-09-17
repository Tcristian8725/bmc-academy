/**
 * Rota de configuração inicial do banco, para rodar UMA VEZ logo após o
 * primeiro deploy em produção (Vercel), já que o ambiente de deploy não tem
 * acesso a terminal/SSH. Protegida por um token secreto (env var
 * SETUP_TOKEN) — sem o token certo, retorna 401.
 *
 * Uso: abrir no navegador (uma vez): https://SEU-APP.vercel.app/api/setup?token=SEU_TOKEN
 *
 * O que faz, em ordem, e todos os passos são seguros de rodar mais de uma
 * vez (idempotentes — nunca apaga dados existentes):
 *   1. Roda as migrações do banco (cria as tabelas, se ainda não existirem).
 *   2. Cria o login real de Administrador do Telles, se ainda não existir.
 *   3. Cria os 4 usuários de teste fictícios + treinamento de exemplo, se
 *      ainda não existirem.
 *   4. Importa as 8 provas reais de Entrega Técnica (pula as que já foram
 *      importadas antes).
 */
import { NextRequest, NextResponse } from "next/server";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/db";
import { ensureRealAdmin, seedIfEmpty } from "@/db/seed-safe";
import { importRealExams } from "@/db/import-real-exams";
import { syncAllPublishedTrainingAssignments } from "@/lib/assignments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  const log: string[] = [];
  try {
    log.push("Rodando migrações do banco...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    log.push("Migrações OK — tabelas criadas/atualizadas.");

    const adminMsg = await ensureRealAdmin("telles.paz@bmchyundai.com.br");
    log.push(adminMsg);

    const seedMsg = await seedIfEmpty();
    log.push(seedMsg);

    log.push("Importando provas reais de Entrega Técnica...");
    const importLog = await importRealExams();
    log.push(...importLog);

    // Pega quem ficou pra trás: contas criadas depois de um treinamento já
    // publicado nunca recebiam a atribuição automaticamente antes desta
    // rotina existir (rodada 14).
    const syncMsg = await syncAllPublishedTrainingAssignments();
    log.push(syncMsg);

    log.push("Configuração concluída com sucesso.");
    return NextResponse.json({ ok: true, log });
  } catch (err) {
    log.push(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ ok: false, log }, { status: 500 });
  }
}
