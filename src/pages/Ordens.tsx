import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import { canManageOrders } from "@/lib/permissions";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  ACTIVE_STATUSES,
  CONCLUDED_STATUSES,
  formatDate,
  formatCliente,
} from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { categoriaDoTipo, prestadoraNome } from "@/config/prestadoras";
import { OrderFormModal } from "@/components/OrderFormModal";
import type { ServiceOrder } from "@/lib/types";

export default function OrdensPage() {
  const { profile } = useAuth();
  const canManage = profile ? canManageOrders(profile.role) : false;

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Por padrão mostra apenas as ativas (aguardando, pendente, não realizada).
  const [statusFilter, setStatusFilter] = useState("ATIVAS");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("service_orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data as ServiceOrder[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ATIVAS"
          ? ACTIVE_STATUSES.includes(o.status)
          : statusFilter === "HISTORICO"
          ? CONCLUDED_STATUSES.includes(o.status)
          : o.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.client_name.toLowerCase().includes(q) ||
        (o.client_code ?? "").includes(q) ||
        o.cidade.toLowerCase().includes(q) ||
        o.tipo.toLowerCase().includes(q) ||
        (categoriaDoTipo(o.tipo) ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

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
          placeholder="Buscar por cliente, código, cidade ou tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-[260px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ATIVAS">Ativas (aguardando, pendente, não realizada)</option>
          <option value="HISTORICO">Histórico (concluídas)</option>
          <option value="ALL">Todas</option>
          <optgroup label="Por status">
            {(Object.entries(STATUS_LABELS) as [OrderStatus, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </optgroup>
        </select>
      </div>

      <div className="card overflow-x-auto">
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
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Cidade</th>
                <th className="px-5 py-3">Prestadora</th>
                <th className="px-5 py-3">Abertura</th>
                <th className="px-5 py-3">Disponibilidade</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <Link to={`/ordens/${o.id}`} className="hover:text-brand-600">
                      {formatCliente(o.client_code, o.client_name)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {o.tipo}
                    {categoriaDoTipo(o.tipo) && (
                      <span className="block text-xs text-gray-400">
                        {categoriaDoTipo(o.tipo)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{o.cidade}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {prestadoraNome(o.prestadora_id)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(o.opened_at)}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatDate(o.availability_at)}
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
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
