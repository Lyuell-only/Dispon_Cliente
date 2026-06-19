import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_LABELS, canManageUsers } from "@/lib/permissions";
import { prestadoraNome } from "@/config/prestadoras";

export function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-gray-500">
        Carregando perfil... Se isso persistir, verifique se o seu usuário tem um
        registro na tabela <code>profiles</code> no Supabase.
      </div>
    );
  }

  const links = [
    { to: "/", label: "Visão geral", end: true, show: true },
    { to: "/ordens", label: "Ordens de serviço", show: true },
    { to: "/usuarios", label: "Usuários", show: canManageUsers(profile.role) },
  ].filter((l) => l.show);

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-5">
          <h1 className="text-lg font-bold text-brand-700">Dispon Cliente</h1>
          <p className="text-xs text-gray-500">Painel de disponibilidade</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-gray-800">
            {profile.name}
          </p>
          <span className="badge mt-1 bg-brand-100 text-brand-700">
            {ROLE_LABELS[profile.role]}
          </span>
          {profile.role === "EMPRESA" && (
            <p className="mt-1 truncate text-xs text-gray-500">
              {prestadoraNome(profile.prestadora_id)}
            </p>
          )}
          <button onClick={handleSignOut} className="btn-secondary mt-3 w-full">
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
