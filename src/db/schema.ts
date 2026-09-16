import {
  pgTable,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// BMC ACADEMY — schema do banco de dados (protótipo)
// Modelado a partir da seção 23 (Banco de Dados) do Prompt Mestre.
// Banco: PostgreSQL (compatível com Neon/Supabase/Render/qualquer Postgres
// gerenciado gratuito — basta trocar DATABASE_URL). Migrado do SQLite inicial
// do protótipo para viabilizar deploy real (Vercel + Postgres gerenciado).
// ---------------------------------------------------------------------------

function id(name = "id") {
  return text(name).primaryKey().$defaultFn(() => crypto.randomUUID());
}

function timestamps() {
  return {
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  };
}

// --- Organização --------------------------------------------------------

export const branches = pgTable("branches", {
  id: id(),
  name: text("name").notNull(), // filial
  region: text("region"), // região
  ...timestamps(),
});

// --- Usuários -------------------------------------------------------------

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(), // login — de preferência o e-mail usado no SAB
  passwordHash: text("password_hash").notNull(),
  role: text("role", {
    enum: ["ADMIN", "GESTOR", "TECNICO", "RC"],
  }).notNull(),
  registrationNumber: text("registration_number"), // matrícula
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  position: text("position"), // cargo
  department: text("department"),
  branchId: text("branch_id").references(() => branches.id),
  managerId: text("manager_id"), // auto-referência ao gestor (FK aplicada via relations)
  cpf: text("cpf"), // CPF — só a partir do autocadastro (seção 3 do Prompt Mestre)
  // CNPJ pode se repetir entre vários usuários (várias pessoas da mesma empresa
  // terceirizada podem ser técnicas/RCs) — de propósito, sem restrição de único.
  cnpj: text("cnpj"),
  address: text("address"), // endereço completo — texto livre por enquanto
  // false só para contas criadas pelo autocadastro público (/solicitar-acesso),
  // até a pessoa completar nome/CPF/CNPJ/endereço/tipo no primeiro acesso.
  // Contas criadas pelo admin já nascem com o perfil completo (default true).
  profileCompleted: boolean("profile_completed").notNull().default(true),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { mode: "string", withTimezone: true }),
  ...timestamps(),
});

// --- Equipamentos -----------------------------------------------------------

export const equipmentFamilies = pgTable("equipment_families", {
  id: id(),
  name: text("name").notNull(), // ex.: Escavadeiras (A CONFIRMAR — lista não fechada)
  ...timestamps(),
});

export const equipmentModels = pgTable("equipment_models", {
  id: id(),
  familyId: text("family_id").references(() => equipmentFamilies.id).notNull(),
  name: text("name").notNull(),
  ...timestamps(),
});

// --- Treinamentos -----------------------------------------------------------

export const trainings = pgTable("trainings", {
  id: id(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", {
    enum: [
      "PRODUTO",
      "TECNICO",
      "MANUTENCAO",
      "DIAGNOSTICO",
      "HIDRAULICA",
      "ELETRICA",
      "MOTOR",
      "OPERACAO",
      "APLICACAO",
      "SEGURANCA",
      "COMERCIAL",
      "POS_VENDAS",
    ],
  }).notNull(),
  targetAudience: text("target_audience"), // público-alvo
  equipmentModelId: text("equipment_model_id").references(() => equipmentModels.id),
  workloadHours: doublePrecision("workload_hours"), // carga horária
  instructor: text("instructor"),
  publishedAt: timestamp("published_at", { mode: "string", withTimezone: true }),
  validUntil: timestamp("valid_until", { mode: "string", withTimezone: true }), // validade / vencimento
  published: boolean("published").notNull().default(false),
  ...timestamps(),
});

// conteúdo de um treinamento: vídeos, PDFs, apresentações, links etc.
export const lessons = pgTable("lessons", {
  id: id(),
  trainingId: text("training_id").references(() => trainings.id).notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  type: text("type", { enum: ["VIDEO", "PDF", "SLIDES", "LINK", "TEXT"] }).notNull(),
  url: text("url"), // link do vídeo (YouTube/Vimeo não-listado), PDF, apresentação etc.
  content: text("content"), // texto livre quando type = TEXT
  ...timestamps(),
});

// --- Trilhas de aprendizagem -------------------------------------------------

export const learningPaths = pgTable("learning_paths", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  ...timestamps(),
});

export const learningPathCourses = pgTable("learning_path_courses", {
  id: id(),
  learningPathId: text("learning_path_id").references(() => learningPaths.id).notNull(),
  trainingId: text("training_id").references(() => trainings.id).notNull(),
  order: integer("order").notNull().default(0),
  // pré-requisito: precisa concluir este treinamento antes de liberar o próximo da trilha
  requiresPreviousCompleted: boolean("requires_previous_completed").notNull().default(true),
});

// --- Atribuições e progresso -------------------------------------------------

export const trainingAssignments = pgTable("training_assignments", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  trainingId: text("training_id").references(() => trainings.id).notNull(),
  required: boolean("required").notNull().default(true), // obrigatório x opcional
  assignedAt: timestamp("assigned_at", { mode: "string", withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  assignedBy: text("assigned_by").references(() => users.id),
});

export const progress = pgTable("progress", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  trainingId: text("training_id").references(() => trainings.id).notNull(),
  status: text("status", {
    enum: ["NAO_INICIADO", "EM_ANDAMENTO", "CONCLUIDO"],
  })
    .notNull()
    .default("NAO_INICIADO"),
  startedAt: timestamp("started_at", { mode: "string", withTimezone: true }),
  lastAccessAt: timestamp("last_access_at", { mode: "string", withTimezone: true }),
  completedAt: timestamp("completed_at", { mode: "string", withTimezone: true }),
  percentComplete: doublePrecision("percent_complete").notNull().default(0),
  lastLessonId: text("last_lesson_id").references(() => lessons.id), // "continuar de onde parou"
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  ...timestamps(),
});

// --- Provas -------------------------------------------------------------

export const exams = pgTable("exams", {
  id: id(),
  trainingId: text("training_id").references(() => trainings.id).notNull(),
  title: text("title").notNull(),
  minScorePercent: doublePrecision("min_score_percent").notNull().default(70),
  maxAttempts: integer("max_attempts").notNull().default(3),
  timeLimitMinutes: integer("time_limit_minutes"),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(true),
  shuffleAnswers: boolean("shuffle_answers").notNull().default(true),
  showAnswersAfter: boolean("show_answers_after").notNull().default(true), // feedback com gabarito
  ...timestamps(),
});

export const questions = pgTable("questions", {
  id: id(),
  examId: text("exam_id").references(() => exams.id).notNull(),
  type: text("type", {
    enum: ["MULTIPLA_ESCOLHA", "VERDADEIRO_FALSO", "MULTIPLA_RESPOSTA", "ASSOCIACAO"],
  }).notNull(),
  statement: text("statement").notNull(), // enunciado
  imageUrl: text("image_url"),
  explanation: text("explanation"),
  points: doublePrecision("points").notNull().default(1),
  order: integer("order").notNull().default(0),
});

export const answers = pgTable("answers", {
  id: id(),
  questionId: text("question_id").references(() => questions.id).notNull(),
  text: text("text").notNull(),
  correct: boolean("correct").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const examAttempts = pgTable("exam_attempts", {
  id: id(),
  examId: text("exam_id").references(() => exams.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  startedAt: timestamp("started_at", { mode: "string", withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  submittedAt: timestamp("submitted_at", { mode: "string", withTimezone: true }),
  scorePercent: doublePrecision("score_percent"),
  passed: boolean("passed"),
  answersJson: text("answers_json"), // respostas do usuário (JSON), simples para o protótipo
});

// --- Certificados -------------------------------------------------------

export const certificates = pgTable("certificates", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  trainingId: text("training_id").references(() => trainings.id).notNull(),
  examAttemptId: text("exam_attempt_id").references(() => examAttempts.id),
  code: text("code").notNull().unique(), // código único de validação
  workloadHours: doublePrecision("workload_hours"),
  scorePercent: doublePrecision("score_percent"),
  issuedAt: timestamp("issued_at", { mode: "string", withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  expiresAt: timestamp("expires_at", { mode: "string", withTimezone: true }), // vencimento/recertificação
  pdfPath: text("pdf_path"),
});

// --- Notificações -------------------------------------------------------

export const notificationLogs = pgTable("notification_logs", {
  id: id(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["ENVIADO", "FALHOU", "SIMULADO"] }).notNull(),
  error: text("error"),
  relatedTrainingId: text("related_training_id"),
  relatedUserId: text("related_user_id"),
  sentAt: timestamp("sent_at", { mode: "string", withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

// --- Auditoria -------------------------------------------------------

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  userId: text("user_id"),
  action: text("action").notNull(), // ex.: LOGIN, LOGIN_FAILED, USER_CREATED, TRAINING_ASSIGNED, EXAM_SUBMITTED, CERTIFICATE_ISSUED...
  details: text("details"), // JSON livre
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});
