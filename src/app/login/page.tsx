import Image from "next/image";
import Link from "next/link";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <Image
        src="/branding/login-bg.jpg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex items-center justify-center rounded-xl bg-white/95 px-6 py-4 shadow-lg backdrop-blur">
            <Image
              src="/branding/logo.png"
              alt="BMC | Hyundai"
              width={220}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </div>
          <h1 className="text-lg font-semibold text-white drop-shadow">BMC Academy</h1>
          <p className="text-sm text-gray-200 drop-shadow">
            Plataforma de Treinamento Técnico e Comercial
          </p>
        </div>

        <LoginForm />
        <p className="mt-4 text-center text-sm">
          <Link
            href="/solicitar-acesso"
            className="font-medium text-white underline decoration-white/40 underline-offset-2 hover:decoration-white"
          >
            Ainda não tenho conta
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-gray-200 drop-shadow">
          Protótipo interno de validação — dados de teste.
        </p>
      </div>
    </div>
  );
}
