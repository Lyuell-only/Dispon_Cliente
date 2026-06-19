"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/lib/permissions";

type User = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof ROLE_LABELS;
  clientId: string | null;
  client: { name: string } | null;
};

type Client = { id: string; name: string };

const EMPTY = {
  name: "",
  email: "",
  password: "",
  role: "EMPRESA",
  clientId: "",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [u, c] = await Promise.all([
      fetch("/api/usuarios"),
      fetch("/api/clientes"),
    ]);
    setUsers(u.ok ? await u.json() : []);
    setClients(c.ok ? await c.json() : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        clientId: form.role === "EMPRESA" ? form.clientId || null : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar.");
      return;
    }
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <button className="btn-primary" onClick={openCreate}>
          + Novo usuário
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nenhum usuário cadastrado.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Permissão</th>
                <th className="px-5 py-3">Cliente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="badge bg-brand-100 text-brand-700">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {u.client?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Novo usuário</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Senha</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="label">Permissão</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {form.role === "EMPRESA" && (
                <div>
                  <label className="label">Cliente vinculado</label>
                  <select
                    className="input"
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
