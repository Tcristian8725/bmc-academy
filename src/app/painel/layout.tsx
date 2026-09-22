import { requireUser } from "@/lib/auth";
import TopNav from "@/components/top-nav";
import { listNotificationsForUser } from "@/lib/training-notifications";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser(["TECNICO", "RC", "FUNCIONARIO"]);
  const notifications = await listNotificationsForUser(session.userId!);

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        name={session.name!}
        role={session.role!}
        links={[
          { href: "/painel", label: "Meus treinamentos" },
          { href: "/painel/certificados", label: "Meus certificados" },
        ]}
        profileHref="/painel/perfil"
        notifications={notifications}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
