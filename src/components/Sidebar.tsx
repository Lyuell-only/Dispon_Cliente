"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { ROLE_LABELS, canManageClients, canManageUsers } from "@/lib/permissions";

export function Sidebar({
  role,
  name,
  email,
}: {
  role: Role;
  name: string;
  email: string;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Visão geral", show: true },
    { href: "/dashboard/ordens", label: "Ordens de serviço", show: true },
    { href: "/dashboard/clientes", label: "Clientes", show: canManageClients(role) },
    { href: "/dashboard/usuarios", label: "Usuários", show: canManageUsers(role) },
  ].filter((l) => l.show);

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <h1 className="text-lg font-bold text-brand-700">Dispon Cliente</h1>
        <p className="text-xs text-gray-500">Painel de disponibilidade</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <p className="truncate text-sm font-medium text-gray-800">{name}</p>
        <p className="truncate text-xs text-gray-500">{email}</p>
        <span className="badge mt-2 bg-brand-100 text-brand-700">
          {ROLE_LABELS[role]}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-secondary mt-3 w-full"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
