import { requireUser } from "@/lib/auth";
import TopNav from "@/components/top-nav";
import { pool } from "@/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser(["ADMIN"]);

  // Cadastros concluídos aguardando decisão — número no menu "Aprovações".
  let pending = 0;
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS c FROM users WHERE approval_status = 'PENDENTE' AND profile_completed = true AND deleted_at IS NULL`
    );
    pending = Number(rows[0]?.c ?? 0);
  } catch {
    pending = 0;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        name={session.name!}
        role={session.role!}
        links={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/aprovacoes", label: pending > 0 ? `Aprovações (${pending})` : "Aprovações" },
          { href: "/admin/usuarios", label: "Usuários" },
          { href: "/admin/treinamentos", label: "Treinamentos" },
          { href: "/admin/trilhas", label: "Trilhas" },
          { href: "/admin/diagnostico", label: "Diagnóstico" },
          { href: "/admin/regioes", label: "Regiões" },
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
