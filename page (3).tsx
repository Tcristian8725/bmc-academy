import NewTrainingForm from "./new-training-form";
import { requireUser } from "@/lib/auth";

export default async function NovoTreinamentoPage() {
  await requireUser(["ADMIN"]);
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Novo treinamento</h1>
      <NewTrainingForm />
    </div>
  );
}
