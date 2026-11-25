import Link from "next/link";
import { userForResetToken } from "@/lib/password-reset";
import ResetWithTokenForm from "./reset-form";

export const dynamic = "force-dynamic";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const user = await userForResetToken(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-4">
            <span className="text-xl font-extrabold tracking-tight text-white">
              BMC <span className="mx-1 font-light">|</span> HYUNDAI
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Criar nova senha</h1>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {user && token ? (
            <ResetWithTokenForm token={token} />
          ) : (
            <div className="space-y-3 text-sm">
              <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
                Este link expirou ou já foi usado. Peça um novo link para criar a sua senha.
              </p>
              <Link
                href="/esqueci-senha"
                className="block w-full rounded-lg bg-brand px-4 py-2.5 text-center font-semibold text-white hover:bg-brand-dark"
              >
                Pedir novo link
              </Link>
            </div>
          )}
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
