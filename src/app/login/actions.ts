"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { getSession } from "@/lib/session";

export interface LoginFormState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const result = await login(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  const session = await getSession();
  if (session.role === "ADMIN") {
    redirect("/admin");
  }
  if (session.role === "GESTOR") {
    redirect("/gestor");
  }
  redirect("/painel");
}
