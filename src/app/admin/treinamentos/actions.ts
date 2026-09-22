"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { trainings } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { TRAINING_CATEGORY_VALUES } from "@/lib/categories";

export interface TrainingFormState {
  error?: string;
}

export async function createTrainingAction(
  _prev: TrainingFormState,
  formData: FormData
): Promise<TrainingFormState> {
  const session = await requireUser(["ADMIN"]);

  const code = String(formData.get("code") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "") || null;
  const category = String(formData.get("category") || "TECNICO");
  const workloadHours = Number(formData.get("workloadHours") || 0) || null;
  const instructor = String(formData.get("instructor") || "") || null;

  if (!code || !title) {
    return { error: "Informe código e título do treinamento." };
  }
  if (!TRAINING_CATEGORY_VALUES.includes(category as (typeof TRAINING_CATEGORY_VALUES)[number])) {
    return { error: "Categoria inválida." };
  }

  let created;
  try {
    [created] = await db
      .insert(trainings)
      .values({
        code,
        title,
        description,
        category: category as (typeof TRAINING_CATEGORY_VALUES)[number],
        workloadHours,
        instructor,
        published: false,
      })
      .returning();
  } catch {
    return { error: "Já existe um treinamento com este código." };
  }

  await logAudit(session.userId!, "TRAINING_CREATED", { code, title });
  revalidatePath("/admin/treinamentos");
  redirect(`/admin/treinamentos/${created.id}`);
}
