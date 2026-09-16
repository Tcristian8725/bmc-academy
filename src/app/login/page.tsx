import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-4">
            <span className="text-xl font-extrabold tracking-tight text-white">
              BMC <span className="mx-1 font-light">|</span> HYUNDAI
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">BMC Academy</h1>
          <p className="text-sm text-gray-500">
            Plataforma de Treinamento Técnico e Comercial
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-gray-400">
          Protótipo interno de validação — dados de teste.
        </p>
      </div>
    </div>
  );
}
