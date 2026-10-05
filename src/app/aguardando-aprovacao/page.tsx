import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import Image from "next/image";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireLoggedIn } from "@/lib/auth";
import { logoutAction } from "@/app/actions/logout";
import { APPROVAL_LABEL, type ApprovalStatus } from "@/lib/approval";

const MESSAGES: Record<Exclude<ApprovalStatus, "APROVADO">, { title: string; text: string }> = {
  PENDENTE: {
    title: "Aguardando aprovação do gestor",
    text: "Recebemos o seu cadastro. Agora ele aguarda a aprovação do gestor da BMC Academy antes de você entrar nos treinamentos. Assim que for aprovado, você receberá um e-mail.",
  },
  AGUARDANDO_HOMOLOGACAO: {
    title: "Aprovado, aguardando homologação",
    text: "Seu cadastro foi aprovado, mas o acesso aos treinamentos fica pausado até a conclusão da sua homologação. Quando ela terminar, o acesso será liberado e você será avisado por e-mail.",
  },
  NAO_HOMOLOGADO: {
    title: "Técnico não homologado",
    text: "Seu cadastro consta como técnico não homologado, por isso o acesso aos treinamentos não foi liberado. Em caso de dúvida, fale com a equipe da BMC.",
  },
};

export default async function AguardandoAprovacaoPage() {
  const session = await requireLoggedIn();
  if (session.profileCompleted === false) redirect("/cadastro");

  const [user] = await db
    .select({ approvalStatus: users.approvalStatus })
    .from(users)
    .where(eq(users.id, session.userId));
  const status = (user?.approvalStatus ?? "PENDENTE") as ApprovalStatus;

  // Já liberado (ou administrador): não faz sentido ficar nesta tela.
  if (status === "APROVADO" || session.role === "ADMIN") redirect("/");

  const msg = MESSAGES[status];

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 ring-1 ring-black/5">
            <Image
              src="/branding/logo.png"
              alt="BMC | Hyundai"
              width={220}
              height={32}
              className="h-7 w-auto"
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <p className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {APPROVAL_LABEL[status]}
          </p>
          <h1 className="text-lg font-semibold text-foreground">{msg.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{msg.text}</p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href="/aguardando-aprovacao"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Atualizar
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
