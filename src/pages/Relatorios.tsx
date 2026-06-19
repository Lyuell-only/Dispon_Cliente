import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import { ACTIVE_STATUSES } from "@/lib/utils";
import { categoriaDoTipo, prestadoraNome } from "@/config/prestadoras";
import type { ServiceOrder } from "@/lib/types";

type Linha = { chave: string; total: number };

function agrupar(
  orders: ServiceOrder[],
  chaveDe: (o: ServiceOrder) => string
): Linha[] {
  const mapa = new Map<string, number>();
  for (const o of orders) {
    const k = chaveDe(o) || "—";
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return Array.from(mapa.entries())
    .map(([chave, total]) => ({ chave, total }))
    .sort((a, b) => b.total - a.total);
}

function Tabela({ titulo, linhas }: { titulo: string; linhas: Linha[] }) {
  const total = linhas.reduce((s, l) => s + l.total, 0);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
        <h2 className="font-semibold text-gray-900">{titulo}</h2>
        <span className="text-sm text-gray-500">{total}</span>
      </div>
      {linhas.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-gray-500">Sem dados.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-gray-100">
            {linhas.map((l) => (
              <tr key={l.chave}>
                <td className="px-5 py-2.5 text-gray-700">{l.chave}</td>
                <td className="px-5 py-2.5 text-right font-medium text-gray-900">
                  {l.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

  const porCidade = useMemo(() => agrupar(base, (o) => o.cidade), [base]);
  const porTipo = useMemo(() => agrupar(base, (o) => o.tipo), [base]);
  const porCategoria = useMemo(
    () => agrupar(base, (o) => categoriaDoTipo(o.tipo) ?? "—"),
    [base]
  );
  const porPrestadora = useMemo(
    () => agrupar(base, (o) => prestadoraNome(o.prestadora_id)),
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
            }.`}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tabela titulo="Por cidade" linhas={porCidade} />
        <Tabela titulo="Por tipo de OS" linhas={porTipo} />
        {!isEmpresa && (
          <>
            <Tabela titulo="Por categoria" linhas={porCategoria} />
            <Tabela titulo="Por prestadora" linhas={porPrestadora} />
          </>
        )}
      </div>
    </div>
  );
}
