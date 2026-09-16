import { requireUser } from "@/lib/auth";
import SenhaForm from "./senha-form";

export default async function TrocarSenhaPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Trocar senha</h1>
        <p className="text-sm text-gray-500">
          Informe sua senha atual e escolha uma nova senha para sua conta.
        </p>
      </div>
      <SenhaForm />
    </div>
  );
}
