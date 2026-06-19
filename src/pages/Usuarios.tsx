import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_LABELS, canManageUsers } from "@/lib/permissions";
import { PRESTADORAS } from "@/config/prestadoras";
import type { Profile, Role } from "@/lib/types";

export default function UsuariosPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (profile && !canManageUsers(profile.role)) {
    return <Navigate to="/" replace />;
  }

  function updateLocal(id: string, patch: Partial<Profile>) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function save(u: Profile) {
    setSavingId(u.id);
    const { error } = await supabase
      .from("profiles")
      .update({
        role: u.role,
        prestadora_id: u.role === "EMPRESA" ? u.prestadora_id : null,
      })
      .eq("id", u.id);
    setSavingId(null);
    if (error) alert(error.message);
    else load();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Usuários</h1>
      <p className="mb-6 text-sm text-gray-500">
        Os usuários se cadastram pela tela de login (ou são convidados pelo painel
        do Supabase). Aqui o administrador define a permissão e, para empresas, a
        prestadora vinculada.
      </p>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Permissão</th>
                <th className="px-5 py-3">Prestadora (empresa)</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3">
                    <select
                      className="input max-w-[160px]"
                      value={u.role}
                      onChange={(e) =>
                        updateLocal(u.id, { role: e.target.value as Role })
                      }
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className="input max-w-[200px]"
                      value={u.prestadora_id ?? ""}
                      disabled={u.role !== "EMPRESA"}
                      onChange={(e) =>
                        updateLocal(u.id, { prestadora_id: e.target.value || null })
                      }
                    >
                      <option value="">—</option>
                      {PRESTADORAS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      className="btn-primary"
                      onClick={() => save(u)}
                      disabled={savingId === u.id}
                    >
                      {savingId === u.id ? "Salvando..." : "Salvar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
