"use client";

import { useState } from "react";
import { STATUS_LABELS } from "@/lib/utils";

type Client = { id: string; name: string };

export type OrderFormInitial = {
  id?: string;
  title?: string;
  type?: string;
  description?: string | null;
  clientId?: string;
  status?: string;
  openedAt?: string;
  availabilityAt?: string;
};

export function OrderFormModal({
  clients,
  initial = {},
  onClose,
  onSaved,
}: {
  clients: Client[];
  initial?: OrderFormInitial;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial.id);
  const [title, setTitle] = useState(initial.title ?? "");
  const [type, setType] = useState(initial.type ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [clientId, setClientId] = useState(initial.clientId ?? "");
  const [status, setStatus] = useState(initial.status ?? "ABERTA");
  const [openedAt, setOpenedAt] = useState(initial.openedAt ?? "");
  const [availabilityAt, setAvailabilityAt] = useState(initial.availabilityAt ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      title,
      type,
      description,
      clientId,
      status,
      openedAt: openedAt || null,
      availabilityAt: availabilityAt || null,
    };

    const res = await fetch(
      isEdit ? `/api/ordens/${initial.id}` : "/api/ordens",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar.");
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
            <label className="label">Título</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de ordem</label>
              <input
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Ex.: Manutenção, Instalação..."
                required
              />
            </div>
            <div>
              <label className="label">Cliente</label>
              <select
                className="input"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
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
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input min-h-[80px]"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
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
