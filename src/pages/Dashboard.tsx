import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { STATUS_LABELS, STATUS_STYLES, formatDate, formatCliente } from "@/lib/utils";
import { prestadoraNome } from "@/config/prestadoras";
import type { ServiceOrder } from "@/lib/types";

export default function DashboardPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("service_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as ServiceOrder[]) ?? []);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const count = (s: string) => orders.filter((o) => o.status === s).length;
    return {
      total: orders.length,
      abertas: count("ABERTA"),
      emAndamento: count("EM_ANDAMENTO"),
      concluidas: count("CONCLUIDA"),
    };
  }, [orders]);

  const cards = [
    { label: "Total de ordens", value: stats.total, color: "text-gray-900" },
    { label: "Abertas", value: stats.abertas, color: "text-blue-600" },
    { label: "Em andamento", value: stats.emAndamento, color: "text-amber-600" },
    { label: "Concluídas", value: stats.concluidas, color: "text-green-600" },
  ];

  const recentes = orders.slice(0, 5);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Visão geral</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`mt-1 text-3xl font-bold ${c.color}`}>
              {loading ? "—" : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Ordens recentes</h2>
          <Link to="/ordens" className="text-sm text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Carregando...</p>
        ) : recentes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nenhuma ordem de serviço cadastrada.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentes.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/ordens/${o.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatCliente(o.client_code, o.client_name)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {o.cidade} · {o.tipo} · {prestadoraNome(o.prestadora_id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden text-sm text-gray-500 sm:block">
                      Disp.: {formatDate(o.availability_at)}
                    </span>
                    <span className={`badge ${STATUS_STYLES[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
