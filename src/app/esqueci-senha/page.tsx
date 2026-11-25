import Link from "next/link";
import ForgotPasswordForm from "./forgot-form";

export default function EsqueciSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-4">
            <span className="text-xl font-extrabold tracking-tight text-white">
              BMC <span className="mx-1 font-light">|</span> HYUNDAI
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Esqueci minha senha</h1>
          <p className="text-sm text-gray-500">
            Informe o e-mail que você usa para entrar e enviaremos um link para criar uma nova
            senha.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-brand hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
