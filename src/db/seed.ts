/**
 * Seed de dados FICTÍCIOS para desenvolvimento/teste do protótipo BMC Academy.
 * Nenhum destes usuários, e-mails ou treinamentos é real — servem apenas para
 * demonstrar o fluxo ponta a ponta descrito na seção 30 do Prompt Mestre.
 *
 * Rodar com: npm run db:seed
 */
import { db, pool } from "./index";
import {
  branches,
  users,
  equipmentFamilies,
  equipmentModels,
  trainings,
  lessons,
  exams,
  questions,
  answers,
  learningPaths,
  learningPathCourses,
  trainingAssignments,
} from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Limpando dados existentes (protótipo)...");
  const tableNames = [
    "audit_logs",
    "notification_logs",
    "certificates",
    "exam_attempts",
    "progress",
    "training_assignments",
    "learning_path_courses",
    "learning_paths",
    "answers",
    "questions",
    "exams",
    "lessons",
    "trainings",
    "equipment_models",
    "equipment_families",
    "users",
    "branches",
  ];
  for (const t of tableNames) {
    await pool.query(`DELETE FROM ${t}`);
  }

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  console.log("Criando filial de teste...");
  const [matriz] = await db
    .insert(branches)
    .values({ name: "Filial Matriz (teste)", region: "Sudeste (A CONFIRMAR)" })
    .returning();

  console.log("Criando usuários de teste...");
  const [admin] = await db
    .insert(users)
    .values({
      name: "Telles Paz (admin de teste)",
      email: "admin@teste.bmcacademy.local",
      passwordHash: hash("admin123"),
      role: "ADMIN",
      position: "Administrador da plataforma",
      branchId: matriz.id,
    })
    .returning();

  const [gestor] = await db
    .insert(users)
    .values({
      name: "Gestor Exemplo (teste)",
      email: "gestor@teste.bmcacademy.local",
      passwordHash: hash("gestor123"),
      role: "GESTOR",
      position: "Gestor de equipe (exemplo)",
      branchId: matriz.id,
    })
    .returning();

  const [tecnico] = await db
    .insert(users)
    .values({
      name: "Técnico Exemplo (teste)",
      email: "tecnico@teste.bmcacademy.local",
      passwordHash: hash("tecnico123"),
      role: "TECNICO",
      position: "Técnico de campo",
      managerId: gestor.id,
      branchId: matriz.id,
    })
    .returning();

  const [rc] = await db
    .insert(users)
    .values({
      name: "RC Exemplo (teste)",
      email: "rc@teste.bmcacademy.local",
      passwordHash: hash("rc123456"),
      role: "RC",
      position: "Representante Comercial (exemplo)",
      managerId: gestor.id,
      branchId: matriz.id,
    })
    .returning();

  console.log("Criando família/modelo de equipamento de exemplo...");
  const [familia] = await db
    .insert(equipmentFamilies)
    .values({ name: "Escavadeiras (exemplo — lista não fechada)" })
    .returning();

  const [modelo] = await db
    .insert(equipmentModels)
    .values({ familyId: familia.id, name: "R380LC-9S (exemplo)" })
    .returning();

  console.log("Criando treinamento de exemplo...");
  const [training] = await db
    .insert(trainings)
    .values({
      code: "TRN-001",
      title: "Introdução à Operação Segura — Escavadeiras (exemplo)",
      description:
        "Treinamento de exemplo cobrindo fundamentos de segurança e operação. Conteúdo de teste.",
      category: "SEGURANCA",
      targetAudience: "Técnicos e RCs",
      equipmentModelId: modelo.id,
      workloadHours: 2,
      instructor: "Instrutor de teste",
      publishedAt: new Date().toISOString(),
      published: true,
    })
    .returning();

  await db.insert(lessons).values([
      {
        trainingId: training.id,
        title: "Boas-vindas e objetivos do treinamento",
        order: 1,
        type: "TEXT",
        content:
          "Bem-vindo ao treinamento de exemplo da BMC Academy. Este conteúdo é fictício e serve apenas para demonstrar o fluxo da plataforma.",
      },
      {
        trainingId: training.id,
        title: "Vídeo: Práticas de segurança (exemplo)",
        order: 2,
        type: "VIDEO",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        trainingId: training.id,
        title: "Material de apoio (PDF de exemplo)",
        order: 3,
        type: "PDF",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    ]);

  console.log("Criando prova de exemplo...");
  const [exam] = await db
    .insert(exams)
    .values({
      trainingId: training.id,
      title: "Avaliação — Introdução à Operação Segura",
      minScorePercent: 70,
      maxAttempts: 3,
      shuffleQuestions: true,
      shuffleAnswers: true,
      showAnswersAfter: true,
    })
    .returning();

  const questionData: {
    type: "MULTIPLA_ESCOLHA" | "VERDADEIRO_FALSO" | "MULTIPLA_RESPOSTA";
    statement: string;
    explanation: string;
    answers: { text: string; correct: boolean }[];
  }[] = [
    {
      type: "VERDADEIRO_FALSO",
      statement: "É seguro operar o equipamento sem realizar a checklist pré-operacional.",
      explanation: "A checklist pré-operacional é obrigatória antes de qualquer operação.",
      answers: [
        { text: "Verdadeiro", correct: false },
        { text: "Falso", correct: true },
      ],
    },
    {
      type: "MULTIPLA_ESCOLHA",
      statement: "Qual EPI é obrigatório na maioria das operações de campo (exemplo)?",
      explanation: "Capacete, óculos e calçado de segurança são itens básicos de EPI.",
      answers: [
        { text: "Capacete de segurança", correct: true },
        { text: "Nenhum, o equipamento já é seguro", correct: false },
        { text: "Apenas luvas de tecido", correct: false },
        { text: "Óculos de sol comuns", correct: false },
      ],
    },
    {
      type: "MULTIPLA_RESPOSTA",
      statement: "Quais itens abaixo fazem parte de uma inspeção pré-operacional básica (exemplo)?",
      explanation: "Nível de óleo, pneus/esteiras e vazamentos são itens típicos de checklist.",
      answers: [
        { text: "Verificar nível de óleo", correct: true },
        { text: "Verificar pneus/esteiras", correct: true },
        { text: "Verificar vazamentos visíveis", correct: true },
        { text: "Ignorar alertas no painel", correct: false },
      ],
    },
  ];

  for (const [i, q] of questionData.entries()) {
    const [question] = await db
      .insert(questions)
      .values({
        examId: exam.id,
        type: q.type,
        statement: q.statement,
        explanation: q.explanation,
        order: i + 1,
      })
      .returning();

    await db.insert(answers).values(
      q.answers.map((a, j) => ({
        questionId: question.id,
        text: a.text,
        correct: a.correct,
        order: j + 1,
      }))
    );
  }

  console.log("Criando trilha de exemplo...");
  const [path] = await db
    .insert(learningPaths)
    .values({
      name: "Trilha Técnica — Escavadeiras (exemplo)",
      description: "Trilha de exemplo com um único treinamento por enquanto.",
    })
    .returning();

  await db.insert(learningPathCourses).values({
    learningPathId: path.id,
    trainingId: training.id,
    order: 1,
    requiresPreviousCompleted: false,
  });

  console.log("Atribuindo treinamento ao técnico e ao RC de teste...");
  await db.insert(trainingAssignments).values([
    { userId: tecnico.id, trainingId: training.id, required: true, assignedBy: admin.id },
    { userId: rc.id, trainingId: training.id, required: true, assignedBy: admin.id },
  ]);

  console.log("\nSeed concluído. Usuários de teste:");
  console.table([
    { papel: "ADMIN", email: admin.email, senha: "admin123" },
    { papel: "GESTOR", email: gestor.email, senha: "gestor123" },
    { papel: "TECNICO", email: tecnico.email, senha: "tecnico123" },
    { papel: "RC", email: rc.email, senha: "rc123456" },
  ]);
}

main()
  .then(async () => {
    console.log("OK");
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
