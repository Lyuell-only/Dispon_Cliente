import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  ACTIVE_STATUSES,
  CONCLUDED_STATUSES,
  getOrderAlert,
  formatDate,
  formatCliente,
} from "@/lib/utils";
import { categoriaDoTipo, prestadoraNome } from "@/config/prestadoras";
import type { ServiceOrder } from "@/lib/types";

export default function DashboardPage() {
  const { profile } = useAuth();
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

  const count = (s: string) => orders.filter((o) => o.status === s).length;

  const cards = [
    { label: "Aguardando disponibilidade", value: count("AGUARDANDO"), color: "text-blue-600" },
    { label: "Pendente", value: count("PENDENTE"), color: "text-amber-600" },
    { label: "Não realizada", value: count("NAO_REALIZADA"), color: "text-red-600" },
    {
      label: "Concluídas",
      value: orders.filter((o) => CONCLUDED_STATUSES.includes(o.status)).length,
      color: "text-green-600",
    },
  ];

  // No painel inicial mostramos só as ordens ativas (em aberto).
  const ativas = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders]
  );

  // Ordens que precisam de atenção segundo a data de disponibilidade + perfil.
  const alertas = useMemo(() => {
    if (!profile) return [];
    return orders
      .map((o) => ({ o, a: getOrderAlert(o, profile.role) }))
      .filter((x) => x.a !== null);
  }, [orders, profile]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Visão geral</h1>
        <Link to="/relatorios" className="text-sm text-brand-600 hover:underline">
          Ver relatórios
        </Link>
      </div>

      {alertas.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-800">
            ⚠ {alertas.length} ordem(ns) precisam de atenção
          </p>
          <ul className="mt-2 space-y-1">
            {alertas.slice(0, 6).map(({ o, a }) => (
              <li key={o.id} className="text-sm">
                <Link
                  to={`/ordens/${o.id}`}
                  className="text-amber-900 hover:underline"
                >
                  {formatCliente(o.client_code, o.client_name)} — {o.cidade}
                </Link>
                <span
                  className={
                    a!.level === "danger"
                      ? "ml-2 font-medium text-red-700"
                      : "ml-2 font-medium text-amber-700"
                  }
                >
                  {a!.text} (disp. {formatDate(o.availability_at)})
                </span>
              </li>
            ))}
          </ul>
          {alertas.length > 6 && (
            <Link
              to="/ordens"
              className="mt-2 inline-block text-sm font-medium text-amber-800 hover:underline"
            >
              ver todas
            </Link>
          )}
        </div>
      )}

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
          <h2 className="font-semibold text-gray-900">
            Ordens em aberto ({ativas.length})
          </h2>
          <Link to="/ordens" className="text-sm text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Carregando...</p>
        ) : ativas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nenhuma ordem em aberto.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {ativas.slice(0, 8).map((o) => (
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
                      {o.cidade} · {categoriaDoTipo(o.tipo) ?? ""} · {o.tipo} ·{" "}
                      {prestadoraNome(o.prestadora_id)}
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
