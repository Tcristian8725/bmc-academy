/**
 * Trilhas de conhecimento (rodada 32) — pedido do Telles: "a possibilidade
 * de colocarmos trilha de conhecimento, tipo entrega técnica, todos os
 * treinamentos de entrega técnica estará dentro dessa trilha [...] a gente
 * ter essa possibilidade". Confirmado com ele que a curadoria é MANUAL: o
 * admin cria a trilha (ex.: "Entrega Técnica", "Elétrica", "Hidráulica") e
 * escolhe à mão quais treinamentos entram — não é automático por categoria
 * (a categoria continua sendo só uma etiqueta/filtro, ver `categories.ts`).
 *
 * Reaproveita as tabelas `learning_paths` / `learning_path_courses`, que já
 * existiam no schema desde o início do protótipo mas nunca tiveram uma UI de
 * admin nem de painel — só o seed de teste (`seed-safe.ts`) as usava.
 *
 * Uma trilha só aparece pro técnico/RC/funcionário se ele já tiver pelo
 * menos um treinamento da trilha atribuído (`training_assignments`) — a
 * trilha é uma forma de agrupar/exibir o que a pessoa já tem, nunca um jeito
 * novo de liberar acesso a treinamento que ela não teria de outra forma.
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  learningPaths,
  learningPathCourses,
  trainings,
  trainingAssignments,
  progress as progressTable,
} from "@/db/schema";

// --- Admin ------------------------------------------------------------

export interface LearningPathSummary {
  id: string;
  name: string;
  description: string | null;
  courseCount: number;
}

export async function listLearningPaths(): Promise<LearningPathSummary[]> {
  const paths = await db.select().from(learningPaths).orderBy(asc(learningPaths.name));
  const courses = await db.select().from(learningPathCourses);

  const countByPath = new Map<string, number>();
  for (const c of courses) {
    countByPath.set(c.learningPathId, (countByPath.get(c.learningPathId) ?? 0) + 1);
  }

  return paths.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    courseCount: countByPath.get(p.id) ?? 0,
  }));
}

export interface LearningPathCourseRow {
  courseId: string;
  trainingId: string;
  order: number;
  title: string;
  code: string;
  category: string;
  published: boolean;
}

export interface LearningPathDetail {
  path: { id: string; name: string; description: string | null };
  courses: LearningPathCourseRow[];
  availableTrainings: { id: string; code: string; title: string }[];
}

export async function getLearningPathDetail(id: string): Promise<LearningPathDetail | null> {
  const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, id));
  if (!path) return null;

  const courses = await db
    .select({
      courseId: learningPathCourses.id,
      trainingId: learningPathCourses.trainingId,
      order: learningPathCourses.order,
      title: trainings.title,
      code: trainings.code,
      category: trainings.category,
      published: trainings.published,
    })
    .from(learningPathCourses)
    .innerJoin(trainings, eq(learningPathCourses.trainingId, trainings.id))
    .where(eq(learningPathCourses.learningPathId, id))
    .orderBy(asc(learningPathCourses.order));

  const inPathIds = new Set(courses.map((c) => c.trainingId));
  const allTrainings = await db.select().from(trainings).orderBy(asc(trainings.title));
  const availableTrainings = allTrainings
    .filter((t) => !inPathIds.has(t.id))
    .map((t) => ({ id: t.id, code: t.code, title: t.title }));

  return {
    path: { id: path.id, name: path.name, description: path.description },
    courses,
    availableTrainings,
  };
}

// --- Painel do técnico/RC/funcionário ----------------------------------

export interface UserLearningPathCourse {
  trainingId: string;
  title: string;
  order: number;
  required: boolean;
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO";
  percentComplete: number;
}

export interface UserLearningPathView {
  id: string;
  name: string;
  description: string | null;
  courses: UserLearningPathCourse[];
}

/** Só devolve trilhas em que a pessoa já tem pelo menos um treinamento
 * atribuído — ver nota no topo do arquivo. */
export async function listLearningPathsForUser(userId: string): Promise<UserLearningPathView[]> {
  const paths = await db.select().from(learningPaths).orderBy(asc(learningPaths.name));
  if (paths.length === 0) return [];

  const rows = await db
    .select({
      learningPathId: learningPathCourses.learningPathId,
      trainingId: learningPathCourses.trainingId,
      order: learningPathCourses.order,
      title: trainings.title,
      required: trainingAssignments.required,
      status: progressTable.status,
      percentComplete: progressTable.percentComplete,
    })
    .from(learningPathCourses)
    .innerJoin(trainings, eq(learningPathCourses.trainingId, trainings.id))
    .innerJoin(
      trainingAssignments,
      and(
        eq(trainingAssignments.trainingId, learningPathCourses.trainingId),
        eq(trainingAssignments.userId, userId)
      )
    )
    .leftJoin(
      progressTable,
      and(
        eq(progressTable.trainingId, learningPathCourses.trainingId),
        eq(progressTable.userId, userId)
      )
    )
    .orderBy(asc(learningPathCourses.order));

  const byPath = new Map<string, UserLearningPathCourse[]>();
  for (const r of rows) {
    const list = byPath.get(r.learningPathId) ?? [];
    list.push({
      trainingId: r.trainingId,
      title: r.title,
      order: r.order,
      required: r.required,
      status: (r.status ?? "NAO_INICIADO") as UserLearningPathCourse["status"],
      percentComplete: r.percentComplete ?? 0,
    });
    byPath.set(r.learningPathId, list);
  }

  return paths
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      courses: byPath.get(p.id) ?? [],
    }))
    .filter((p) => p.courses.length > 0);
}
