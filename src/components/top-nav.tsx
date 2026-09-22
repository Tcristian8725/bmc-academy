import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/logout";
import NotificationBell, { type NotificationItem } from "@/components/notification-bell";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  RC: "Representante Comercial",
  FUNCIONARIO: "Funcionário BMC",
};

export default function TopNav({
  name,
  role,
  links,
  profileHref,
  notifications,
}: {
  name: string;
  role: string;
  links: { href: string; label: string }[];
  /** Quando definido, o nome/perfil no canto superior direito vira um link
   *  para a tela de perfil da própria pessoa (ex.: "/painel/perfil"). */
  profileHref?: string;
  /** Quando definido, mostra o sininho de notificações (ex.: "Novo
   *  treinamento disponível") — só passado pelo painel do técnico/RC/
   *  funcionário por enquanto (ver src/app/painel/layout.tsx). */
  notifications?: NotificationItem[];
}) {
  const nameBlock = profileHref ? (
    <Link
      href={profileHref}
      className="text-right transition hover:opacity-70"
      title="Ver meu perfil"
    >
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-gray-500">{roleLabel[role] ?? role} · Meu perfil</p>
    </Link>
  ) : (
    <div className="text-right">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-gray-500">{roleLabel[role] ?? role}</p>
    </div>
  );
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center rounded-lg bg-white px-3 py-1.5 ring-1 ring-black/5">
            <Image
              src="/branding/logo.png"
              alt="BMC | Hyundai"
              width={220}
              height={32}
              className="h-6 w-auto"
            />
          </div>
          <nav className="hidden gap-4 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-brand"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {notifications !== undefined && <NotificationBell notifications={notifications} />}
          {nameBlock}
          <Link
            href="/senha"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Trocar senha
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-black/5 px-4 py-2 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-brand"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
