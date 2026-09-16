import { requireUser } from "@/lib/auth";
import TopNav from "@/components/top-nav";

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser(["GESTOR"]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        name={session.name!}
        role={session.role!}
        links={[{ href: "/gestor", label: "Minha equipe" }]}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
