import { requireUser } from "@/lib/auth";
import TopNav from "@/components/top-nav";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser(["TECNICO", "RC"]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        name={session.name!}
        role={session.role!}
        links={[
          { href: "/painel", label: "Meus treinamentos" },
          { href: "/painel/certificados", label: "Meus certificados" },
        ]}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
