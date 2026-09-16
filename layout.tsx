import { requireUser } from "@/lib/auth";
import TopNav from "@/components/top-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser(["ADMIN"]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        name={session.name!}
        role={session.role!}
        links={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/usuarios", label: "Usuários" },
          { href: "/admin/treinamentos", label: "Treinamentos" },
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
