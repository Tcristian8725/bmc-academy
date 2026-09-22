"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/painel/notifications-actions";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/** Sininho de notificações no topo da plataforma (pedido do Telles, rodada
 * 31): mostra as últimas notificações da pessoa (ex.: "Novo treinamento
 * disponível") com um contador de não lidas, e marca como lida ao clicar —
 * sem depender de nenhuma lib de ícone (SVG inline). */
export default function NotificationBell({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
        aria-label="Notificações"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 8a6 6 0 1 0-12 0c0 3.5-1 5.5-1.5 6.5-.3.6.1 1.5.9 1.5h13.2c.8 0 1.2-.9.9-1.5C19 13.5 18 11.5 18 8Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 18a2.5 2.5 0 0 0 5 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl bg-white shadow-lg ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
              <p className="text-sm font-semibold text-foreground">Notificações</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-brand hover:underline"
                  onClick={() =>
                    startTransition(() => {
                      markAllNotificationsReadAction();
                    })
                  }
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="p-4 text-sm text-gray-500">Nenhuma notificação ainda.</p>
              )}
              {notifications.map((n) => {
                const body = (
                  <div className={`p-4 text-sm ${n.read ? "" : "bg-brand/5"}`}>
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-gray-500">{n.message}</p>
                  </div>
                );
                const handleClick = () => {
                  setOpen(false);
                  if (!n.read) {
                    startTransition(() => {
                      markNotificationReadAction(n.id);
                    });
                  }
                };
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={handleClick} className="block hover:bg-gray-50">
                    {body}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    type="button"
                    onClick={handleClick}
                    className="block w-full text-left hover:bg-gray-50"
                  >
                    {body}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
