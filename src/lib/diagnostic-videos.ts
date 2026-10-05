import { asc, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { trainingCategoryLabel } from "@/lib/categories";
import {
  diagnosticVideos,
  learningPathCourses,
  learningPaths,
  lessons,
  trainings,
} from "@/db/schema";

/** Vídeo da aba "Diagnóstico", venha ele da trilha ou da biblioteca avulsa. */
export interface DiagnosticEntry {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  videoUrl: string;
  /** "trilha" = treinamento dentro da trilha "Vídeos de Diagnóstico"; "avulso" = tabela diagnostic_videos. */
  source: "trilha" | "avulso";
  published: boolean;
  createdAt?: string;
}

const VIDEO_HOST = /(youtube\.com|youtu\.be|vimeo\.com)/i;
const URL_IN_TEXT = /https?:\/\/[^\s"'<>)]+/gi;

/** Acha o link do vídeo de uma aula: aula de vídeo/URL de YouTube-Vimeo ou
 * (aula de texto) o primeiro link de vídeo dentro do texto. */
function videoUrlOfLesson(l: { type: string; url: string | null; content: string | null }) {
  if (l.url && (l.type === "VIDEO" || VIDEO_HOST.test(l.url))) return l.url.trim();
  if (l.content) {
    const found = l.content.match(URL_IN_TEXT)?.find((u) => VIDEO_HOST.test(u));
    if (found) return found;
  }
  return null;
}

/**
 * Vídeos dos treinamentos que estão na trilha de aprendizagem "Vídeos de
 * Diagnóstico" (qualquer trilha cujo nome contenha "diagnóstico"). É a fonte
 * principal da aba Diagnóstico (rodada 40): o que o Admin coloca na trilha
 * aparece lá, sem precisar cadastrar de novo.
 */
export async function listTrailDiagnosticVideos(opts: { onlyPublished: boolean }) {
  const paths = await db
    .select({ id: learningPaths.id })
    .from(learningPaths)
    .where(ilike(learningPaths.name, "%diagn%"));
  if (paths.length === 0) return { entries: [] as DiagnosticEntry[], withoutVideo: [] as string[] };

  const courses = await db
    .select({
      trainingId: learningPathCourses.trainingId,
      order: learningPathCourses.order,
      title: trainings.title,
      category: trainings.category,
      description: trainings.description,
      published: trainings.published,
    })
    .from(learningPathCourses)
    .innerJoin(trainings, eq(trainings.id, learningPathCourses.trainingId))
    .where(
      inArray(
        learningPathCourses.learningPathId,
        paths.map((p) => p.id)
      )
    )
    .orderBy(asc(learningPathCourses.order));

  const visible = opts.onlyPublished ? courses.filter((c) => c.published) : courses;
  if (visible.length === 0) return { entries: [] as DiagnosticEntry[], withoutVideo: [] as string[] };

  const allLessons = await db
    .select({
      trainingId: lessons.trainingId,
      title: lessons.title,
      order: lessons.order,
      type: lessons.type,
      url: lessons.url,
      content: lessons.content,
    })
    .from(lessons)
    .where(
      inArray(
        lessons.trainingId,
        visible.map((c) => c.trainingId)
      )
    )
    .orderBy(asc(lessons.order));

  const entries: DiagnosticEntry[] = [];
  const withoutVideo: string[] = [];
  const seen = new Set<string>();
  for (const c of visible) {
    if (seen.has(c.trainingId)) continue; // mesmo treinamento em duas trilhas
    seen.add(c.trainingId);
    const vids = allLessons
      .filter((l) => l.trainingId === c.trainingId)
      .map((l) => ({ lesson: l, url: videoUrlOfLesson(l) }))
      .filter((x): x is { lesson: (typeof allLessons)[number]; url: string } => !!x.url);
    if (vids.length === 0) {
      withoutVideo.push(c.title);
      continue;
    }
    vids.forEach((v, i) => {
      entries.push({
        id: `trilha-${c.trainingId}-${i}`,
        title: vids.length === 1 ? c.title : `${c.title} — ${v.lesson.title}`,
        description: c.description,
        topic: trainingCategoryLabel(c.category),
        videoUrl: v.url,
        source: "trilha",
        published: c.published,
      });
    });
  }
  return { entries, withoutVideo };
}

/** Todos os vídeos (publicados ou não) da biblioteca avulsa — admin. */
export async function listAllDiagnosticVideos() {
  return db.select().from(diagnosticVideos).orderBy(desc(diagnosticVideos.createdAt));
}

/** Só os publicados da biblioteca avulsa. */
export async function listPublishedDiagnosticVideos() {
  return db
    .select()
    .from(diagnosticVideos)
    .where(eq(diagnosticVideos.published, true))
    .orderBy(desc(diagnosticVideos.createdAt));
}

/**
 * Lista final da aba Diagnóstico: vídeos da trilha + vídeos avulsos, sem
 * repetir o mesmo link. Cada fonte é isolada em try/catch: se a tabela de
 * vídeos avulsos ainda não existir no banco (migração 0006 pendente), a
 * página continua funcionando só com a trilha — em vez de dar erro 500.
 */
export async function listDiagnosticEntries(opts: { onlyPublished: boolean }) {
  let trail: DiagnosticEntry[] = [];
  let withoutVideo: string[] = [];
  try {
    const r = await listTrailDiagnosticVideos(opts);
    trail = r.entries;
    withoutVideo = r.withoutVideo;
  } catch (e) {
    console.error("diagnostico: falha ao ler a trilha", e);
  }

  let standalone: DiagnosticEntry[] = [];
  try {
    const rows = opts.onlyPublished
      ? await listPublishedDiagnosticVideos()
      : await listAllDiagnosticVideos();
    standalone = rows.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      topic: v.topic,
      videoUrl: v.videoUrl,
      source: "avulso" as const,
      published: v.published,
      createdAt: v.createdAt,
    }));
  } catch (e) {
    console.error("diagnostico: biblioteca avulsa indisponivel (migracao 0006?)", e);
  }

  const urls = new Set(trail.map((t) => t.videoUrl));
  const entries = [...trail, ...standalone.filter((s) => !urls.has(s.videoUrl))];
  return { entries, withoutVideo, trailCount: trail.length };
}
