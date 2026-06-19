"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  toDateInputValue,
} from "@/lib/utils";
import { canManageOrders } from "@/lib/permissions";
import { OrderFormModal } from "@/components/OrderFormModal";

type Order = {
  id: string;
  title: string;
  type: string;
  status: keyof typeof STATUS_LABELS;
  openedAt: string;
  availabilityAt: string | null;
  client: { id: string; name: string };
  _count: { comments: number };
};

type Client = { id: string; name: string };

export default function OrdensPage() {
  const { data: session } = useSession();
  const role = session?.user.role;
  const canManage = role ? canManageOrders(role) : false;

  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/ordens");
    const data = res.ok ? await res.json() : [];
    setOrders(data);
    setLoading(false);
  }

  async function loadClients() {
    if (!canManage) return;
    const res = await fetch("/api/clientes");
    if (res.ok) setClients(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const matchSearch =
        !search ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.client.name.toLowerCase().includes(search.toLowerCase()) ||
        o.type.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ordens de serviço</h1>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Nova ordem
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por título, cliente ou tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-[180px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nenhuma ordem encontrada.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Título</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Abertura</th>
                <th className="px-5 py-3">Disponibilidade</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <Link href={`/dashboard/ordens/${o.id}`} className="hover:text-brand-600">
                      {o.title}
                    </Link>
                    {o._count.comments > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        💬 {o._count.comments}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{o.client.name}</td>
                  <td className="px-5 py-3 text-gray-600">{o.type}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(o.openedAt)}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatDate(o.availabilityAt)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${STATUS_STYLES[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <OrderFormModal
          clients={clients}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          initial={{ openedAt: toDateInputValue(new Date()) }}
        />
      )}
    </div>
  );
}
