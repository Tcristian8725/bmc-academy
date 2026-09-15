/**
 * Versão NÃO destrutiva do seed — usada pela rota de setup em produção
 * (src/app/api/setup/route.ts). Ao contrário de seed.ts (uso local/dev, que
 * apaga tudo antes de recriar), esta versão só cria os dados de teste na
 * primeira vez (verifica se já existem antes de inserir) — nunca apaga nada.
 *
 * Dados 100% fictícios, mesmos do seed.ts — servem apenas para demonstrar o
 * fluxo ponta a ponta descrito na seção 30 do Prompt Mestre.
 */
import { eq } from "drizzle-orm";
import { db } from "./index";
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
import crypto from "crypto";

/**
 * Garante que o login real de Administrador do Telles existe. Só cria na
 * primeira vez — se já existir, não mexe (não reseta senha de quem já usa o
 * sistema). A senha só é revelada no retorno desta função quando ela acabou
 * de ser criada (primeira vez), nunca depois.
 */
export async function ensureRealAdmin(email: string): Promise<string> {
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return `Login real de admin (${email}) já existia — nada foi alterado.`;
  }

  const password = crypto.randomBytes(9).toString("base64url"); // ~12 caracteres, aleatório
  await db.insert(users).values({
    name: "Telles Paz",
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "ADMIN",
    position: "Administrador da plataforma",
  });

  return `Login real de admin criado — e-mail: ${email} / senha: ${password} (guarde esta senha agora, ela não será mostrada de novo).`;
}

export async function seedIfEmpty(): Promise<string> {
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@teste.bmcacademy.local"));
  if (existingAdmin) {
    return "Usuários de teste já existiam — seed pulado (nada foi apagado ou recriado).";
  }

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const [matriz] = await db
    .insert(branches)
    .values({ name: "Filial Matriz (teste)", region: "Sudeste (A CONFIRMAR)" })
    .returning();

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

  const [familia] = await db
    .insert(equipmentFamilies)
    .values({ name: "Escavadeiras (exemplo — lista não fechada)" })
    .returning();

  const [modelo] = await db
    .insert(equipmentModels)
    .values({ familyId: familia.id, name: "R380LC-9S (exemplo)" })
    .returning();

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

  await db.insert(trainingAssignments).values([
    { userId: tecnico.id, trainingId: training.id, required: true, assignedBy: admin.id },
    { userId: rc.id, trainingId: training.id, required: true, assignedBy: admin.id },
  ]);

  return "Seed criado: 4 usuários fictícios (admin/gestor/técnico/RC de teste) + 1 treinamento de exemplo.";
}
