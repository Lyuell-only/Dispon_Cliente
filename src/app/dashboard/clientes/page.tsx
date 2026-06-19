"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  _count: { orders: number };
};

const EMPTY = { name: "", document: "", email: "", phone: "" };

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/clientes");
    setClients(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  function openEdit(c: Client) {
    setEditId(c.id);
    setForm({
      name: c.name,
      document: c.document ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(
      editId ? `/api/clientes/${editId}` : "/api/clientes",
      {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar.");
      return;
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(c: Client) {
    if (
      !confirm(
        `Excluir o cliente "${c.name}"? Isso também removerá as ordens vinculadas.`
      )
    )
      return;
    const res = await fetch(`/api/clientes/${c.id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button className="btn-primary" onClick={openCreate}>
          + Novo cliente
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Carregando...</p>
        ) : clients.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nenhum cliente cadastrado.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Documento</th>
                <th className="px-5 py-3">Contato</th>
                <th className="px-5 py-3">Ordens</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-gray-600">{c.document ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {c.email ?? c.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c._count.orders}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      className="text-sm text-brand-600 hover:underline"
                      onClick={() => openEdit(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="ml-4 text-sm text-red-600 hover:underline"
                      onClick={() => handleDelete(c)}
                    >
                      Excluir
                    </button>
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editId ? "Editar cliente" : "Novo cliente"}
            </h2>
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
                <label className="label">Documento (CNPJ/CPF)</label>
                <input
                  className="input"
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">E-mail</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

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
