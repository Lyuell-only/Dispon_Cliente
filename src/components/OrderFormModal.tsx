import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import { STATUS_LABELS } from "@/lib/utils";
import { parseCliente, formatCliente } from "@/lib/utils";
import {
  CATEGORIAS,
  CIDADES,
  PRESTADORAS,
  categoriaDoTipo,
  prestadoraNome,
  sugerirPrestadoras,
} from "@/config/prestadoras";
import type { ServiceOrder } from "@/lib/types";

function tiposDaCategoria(categoria: string): string[] {
  return CATEGORIAS.find((c) => c.nome === categoria)?.tipos ?? [];
}

export function OrderFormModal({
  order,
  onClose,
  onSaved,
}: {
  order?: ServiceOrder | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { session } = useAuth();
  const isEdit = Boolean(order);

  const [cliente, setCliente] = useState(
    order ? formatCliente(order.client_code, order.client_name) : ""
  );
  const [categoria, setCategoria] = useState(
    (order && categoriaDoTipo(order.tipo)) || CATEGORIAS[0].nome
  );
  const [tipo, setTipo] = useState(
    order?.tipo ?? CATEGORIAS[0].tipos[0] ?? ""
  );
  const [cidade, setCidade] = useState(order?.cidade ?? CIDADES[0] ?? "");
  const [openedAt, setOpenedAt] = useState(
    order?.opened_at ?? new Date().toISOString().slice(0, 10)
  );
  const [availabilityAt, setAvailabilityAt] = useState(
    order?.availability_at ?? ""
  );
  const [observacao, setObservacao] = useState(order?.observacao ?? "");
  const [status, setStatus] = useState(order?.status ?? "AGUARDANDO");
  const [prestadoraId, setPrestadoraId] = useState(order?.prestadora_id ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const tipos = useMemo(() => tiposDaCategoria(categoria), [categoria]);

  // Sugestão de prestadoras a partir de cidade + categoria.
  const sugestoes = useMemo(
    () => sugerirPrestadoras(cidade, categoria),
    [cidade, categoria]
  );
  const lastSuggestion = useRef<string | null>(order?.prestadora_id ?? null);

  // Ao trocar de categoria, garante que o tipo pertença a ela.
  function handleCategoria(novaCategoria: string) {
    setCategoria(novaCategoria);
    const novos = tiposDaCategoria(novaCategoria);
    if (!novos.includes(tipo)) setTipo(novos[0] ?? "");
  }

  useEffect(() => {
    // Preenche com a sugestão preferida se o usuário ainda não escolheu
    // manualmente (ou se o valor atual era a sugestão anterior).
    const preferida = sugestoes[0] ?? "";
    if (preferida && (prestadoraId === "" || prestadoraId === lastSuggestion.current)) {
      setPrestadoraId(preferida);
    }
    lastSuggestion.current = preferida || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugestoes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const { code, name } = parseCliente(cliente);
    if (!name) {
      setError("Informe o cliente.");
      setSaving(false);
      return;
    }

    const payload = {
      client_code: code,
      client_name: name,
      tipo,
      cidade: cidade.trim(),
      prestadora_id: prestadoraId || null,
      observacao: observacao.trim() || null,
      status,
      opened_at: openedAt || null,
      availability_at: availabilityAt || null,
    };

    const { error } = isEdit
      ? await supabase
          .from("service_orders")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", order!.id)
      : await supabase
          .from("service_orders")
          .insert({ ...payload, created_by: session?.user.id });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {isEdit ? "Editar ordem de serviço" : "Nova ordem de serviço"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Cliente</label>
            <input
              className="input"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="(231232) CLIENTE TALTALTAL"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Formato: (código) NOME DO CLIENTE
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={categoria}
                onChange={(e) => handleCategoria(e.target.value)}
                required
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.nome} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipo de OS</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
              >
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Cidade</label>
            <select
              className="input"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              required
            >
              {CIDADES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data de abertura</label>
              <input
                type="date"
                className="input"
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Data de disponibilidade</label>
              <input
                type="date"
                className="input"
                value={availabilityAt}
                onChange={(e) => setAvailabilityAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Prestadora (encaminhar para)</label>
            <select
              className="input"
              value={prestadoraId}
              onChange={(e) => setPrestadoraId(e.target.value)}
            >
              <option value="">Não encaminhada</option>
              {PRESTADORAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            {sugestoes.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Sugestão para {cidade} / {categoria}:{" "}
                {sugestoes.map((id, i) => (
                  <span key={id}>
                    {i > 0 && " ou "}
                    <button
                      type="button"
                      className={`hover:underline ${
                        prestadoraId === id
                          ? "font-semibold text-brand-700"
                          : "text-brand-600"
                      }`}
                      onClick={() => setPrestadoraId(id)}
                    >
                      {prestadoraNome(id)}
                    </button>
                  </span>
                ))}
              </p>
            )}
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as ServiceOrder["status"])
              }
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Observação (info adicional)</label>
            <textarea
              className="input min-h-[80px]"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
