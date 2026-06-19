import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import { ACTIVE_STATUSES } from "@/lib/utils";
import { prestadoraNome } from "@/config/prestadoras";
import type { ServiceOrder } from "@/lib/types";

type Grupo = {
  chave: string;
  total: number;
  tipos: { tipo: string; total: number }[];
};

function agruparComTipos(
  orders: ServiceOrder[],
  chaveDe: (o: ServiceOrder) => string
): Grupo[] {
  const mapa = new Map<string, Map<string, number>>();
  for (const o of orders) {
    const k = chaveDe(o) || "—";
    const tipo = o.tipo || "—";
    if (!mapa.has(k)) mapa.set(k, new Map());
    const tiposMap = mapa.get(k)!;
    tiposMap.set(tipo, (tiposMap.get(tipo) ?? 0) + 1);
  }
  return Array.from(mapa.entries())
    .map(([chave, tiposMap]) => {
      const tipos = Array.from(tiposMap.entries())
        .map(([tipo, total]) => ({ tipo, total }))
        .sort((a, b) => b.total - a.total);
      const total = tipos.reduce((s, t) => s + t.total, 0);
      return { chave, total, tipos };
    })
    .sort((a, b) => b.total - a.total);
}

function TabelaAgrupada({
  titulo,
  grupos,
}: {
  titulo: string;
  grupos: Grupo[];
}) {
  const total = grupos.reduce((s, g) => s + g.total, 0);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
        <h2 className="font-semibold text-gray-900">{titulo}</h2>
        <span className="text-sm text-gray-500">{total}</span>
      </div>
      {grupos.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-gray-500">Sem dados.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {grupos.map((g) => (
            <li key={g.chave} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{g.chave}</span>
                <span className="badge bg-brand-100 text-brand-700">
                  {g.total}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {g.tipos.map((t) => (
                  <li
                    key={t.tipo}
                    className="flex items-center justify-between pl-3 text-sm text-gray-600"
                  >
                    <span>{t.tipo}</span>
                    <span className="text-gray-900">{t.total}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RelatoriosPage() {
  const { profile } = useAuth();
  const isEmpresa = profile?.role === "EMPRESA";

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [somenteAtivas, setSomenteAtivas] = useState(true);

  useEffect(() => {
    supabase
      .from("service_orders")
      .select("*")
      .then(({ data }) => {
        setOrders((data as ServiceOrder[]) ?? []);
        setLoading(false);
      });
  }, []);

  const base = useMemo(
    () =>
      somenteAtivas
        ? orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
        : orders,
    [orders, somenteAtivas]
  );

  const porCidade = useMemo(
    () => agruparComTipos(base, (o) => o.cidade),
    [base]
  );
  const porPrestadora = useMemo(
    () => agruparComTipos(base, (o) => prestadoraNome(o.prestadora_id)),
    [base]
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={somenteAtivas}
            onChange={(e) => setSomenteAtivas(e.target.checked)}
          />
          Somente ordens em aberto
        </label>
      </div>

      <p className="mb-6 text-sm text-gray-500">
        {loading
          ? "Carregando..."
          : `${base.length} ordem(ns) ${
              somenteAtivas ? "em aberto" : "no total"
            }. Cada grupo mostra o total e a quantidade por tipo de OS.`}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <TabelaAgrupada titulo="Por cidade" grupos={porCidade} />
        {!isEmpresa && (
          <TabelaAgrupada titulo="Por prestadora" grupos={porPrestadora} />
        )}
      </div>
    </div>
  );
}
