"use server";

import { requireUser } from "@/lib/auth";
import { submitExamAttempt, type SubmitExamResult } from "@/lib/training-flow";

export async function submitExamAction(
  examId: string,
  responses: Record<string, string[]>
): Promise<SubmitExamResult> {
  const session = await requireUser(["TECNICO", "RC"]);
  return submitExamAttempt(session.userId!, examId, responses);
}
