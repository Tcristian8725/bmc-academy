import { requireLoggedIn } from "@/lib/auth";
import CadastroForm from "./cadastro-form";

export default async function CadastroPage() {
  await requireLoggedIn();

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-4">
            <span className="text-xl font-extrabold tracking-tight text-white">
              BMC <span className="mx-1 font-light">|</span> HYUNDAI
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Complete seu cadastro</h1>
          <p className="text-sm text-gray-500">
            Antes de continuar, preencha seus dados para liberar seu acesso à BMC Academy.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <CadastroForm />
        </div>
      </div>
    </div>
  );
}
