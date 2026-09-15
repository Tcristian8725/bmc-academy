/**
 * Importa o conteúdo REAL das provas de Entrega Técnica (ver real-exams-data.ts)
 * para dentro do banco. Roda por cima do que já existe (não apaga nada) — é
 * seguro rodar depois do `db:seed`.
 *
 * Decisão do Telles (15/09/2026): importar as provas reais agora, mas SEM
 * marcar nenhuma resposta como correta ainda (o gabarito não pôde ser lido
 * de forma confiável dos documentos do SharePoint — negrito/grifo do Word
 * não sobrevive à extração remota de texto). Por isso:
 *   - todas as alternativas entram com correct = false
 *   - todos os treinamentos entram como RASCUNHO (published = false)
 * Assim que o Telles confirmar o gabarito de cada prova, um admin marca as
 * respostas certas em Admin > Treinamentos > (prova) e publica.
 *
 * Rodar com: npx tsx src/db/import-real-exams.ts
 */
import { eq, and } from "drizzle-orm";
import { db, pool } from "./index";
import {
  equipmentFamilies,
  equipmentModels,
  trainings,
  lessons,
  exams,
  questions,
  answers,
} from "./schema";
import { REAL_EXAMS } from "./real-exams-data";

async function main() {
  console.log(`Importando ${REAL_EXAMS.length} provas reais de Entrega Técnica...\n`);

  for (const item of REAL_EXAMS) {
    console.log(`→ ${item.trainingCode} — ${item.trainingTitle}`);

    // família de equipamento (cria se não existir)
    let [family] = await db
      .select()
      .from(equipmentFamilies)
      .where(eq(equipmentFamilies.name, item.equipmentFamily));
    if (!family) {
      [family] = await db
        .insert(equipmentFamilies)
        .values({ name: item.equipmentFamily })
        .returning();
    }

    // modelo de equipamento (cria se não existir)
    let [model] = await db
      .select()
      .from(equipmentModels)
      .where(
        and(eq(equipmentModels.familyId, family.id), eq(equipmentModels.name, item.equipmentModel))
      );
    if (!model) {
      [model] = await db
        .insert(equipmentModels)
        .values({ familyId: family.id, name: item.equipmentModel })
        .returning();
    }

    // treinamento — pula se já existir (idempotente, permite rodar de novo)
    const [existingTraining] = await db
      .select()
      .from(trainings)
      .where(eq(trainings.code, item.trainingCode));
    if (existingTraining) {
      console.log("  já importado antes — pulando.\n");
      continue;
    }

    const [training] = await db
      .insert(trainings)
      .values({
        code: item.trainingCode,
        title: item.trainingTitle,
        description: `Treinamento de entrega técnica baseado no vídeo real "${item.sourceVideo}". Conteúdo da prova (perguntas e alternativas) é REAL, importado dos documentos oficiais da BMC Academy. IMPORTANTE: o gabarito (respostas corretas) ainda não foi confirmado — este treinamento fica como rascunho até um admin marcar as respostas certas e publicar.`,
        category: "TECNICO",
        targetAudience: "Técnicos",
        equipmentModelId: model.id,
        instructor: null,
        published: false,
      })
      .returning();

    await db.insert(lessons).values({
      trainingId: training.id,
      title: "Vídeo de Entrega Técnica (link pendente)",
      order: 1,
      type: "TEXT",
      content: `Este treinamento é baseado no vídeo "${item.sourceVideo}". O link do vídeo ainda não foi cadastrado — peça ao Telles/Gisele o link (de preferência hospedado no YouTube não-listado ou Vimeo) e troque esta lição por uma lição de vídeo antes de publicar.`,
    });

    const [exam] = await db
      .insert(exams)
      .values({
        trainingId: training.id,
        title: `Avaliação — ${item.trainingTitle}`,
        minScorePercent: 70,
        maxAttempts: 3,
        shuffleQuestions: true,
        shuffleAnswers: true,
        showAnswersAfter: true,
      })
      .returning();

    for (const [qi, q] of item.questions.entries()) {
      const [question] = await db
        .insert(questions)
        .values({
          examId: exam.id,
          type: "MULTIPLA_ESCOLHA",
          statement: q.statement,
          explanation: null,
          order: qi + 1,
        })
        .returning();

      await db.insert(answers).values(
        q.answers.map((text, ai) => ({
          questionId: question.id,
          text,
          correct: false, // gabarito A CONFIRMAR — ver nota acima
          order: ai + 1,
        }))
      );
    }

    console.log(`  ${item.questions.length} questões importadas (rascunho, gabarito pendente).\n`);
  }

  console.log("Importação concluída.");
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
