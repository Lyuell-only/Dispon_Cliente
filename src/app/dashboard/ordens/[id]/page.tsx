"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatDateTime,
  toDateInputValue,
} from "@/lib/utils";
import {
  ROLE_LABELS,
  canManageOrders,
  canChangeStatus,
  canComment,
} from "@/lib/permissions";
import { OrderFormModal } from "@/components/OrderFormModal";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: keyof typeof ROLE_LABELS };
};

type OrderDetail = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  status: keyof typeof STATUS_LABELS;
  openedAt: string;
  availabilityAt: string | null;
  client: { id: string; name: string };
  createdBy: { id: string; name: string } | null;
  comments: Comment[];
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user.role;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/ordens/${id}`);
    if (res.ok) {
      setOrder(await res.json());
    } else {
      setOrder(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (role && canManageOrders(role)) {
      fetch("/api/clientes")
        .then((r) => (r.ok ? r.json() : []))
        .then(setClients);
    }
  }, [role]);

  async function changeStatus(status: string) {
    const res = await fetch(`/api/ordens/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/ordens/${id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: comment }),
    });
    setPosting(false);
    if (res.ok) {
      setComment("");
      load();
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta ordem de serviço?")) return;
    const res = await fetch(`/api/ordens/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/ordens");
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }
  if (!order) {
    return (
      <div>
        <p className="text-sm text-gray-500">Ordem não encontrada.</p>
        <Link href="/dashboard/ordens" className="text-sm text-brand-600 hover:underline">
          ← Voltar
        </Link>
      </div>
    );
  }

  const isManager = role ? canManageOrders(role) : false;

  return (
    <div>
      <Link
        href="/dashboard/ordens"
        className="mb-4 inline-block text-sm text-brand-600 hover:underline"
      >
        ← Voltar para ordens
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {order.client.name} · {order.type}
          </p>
        </div>
        <div className="flex gap-2">
          {isManager && (
            <>
              <button className="btn-secondary" onClick={() => setEditing(true)}>
                Editar
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                Excluir
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Detalhes */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Detalhes</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`badge ${STATUS_STYLES[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo</dt>
                <dd className="mt-1 text-gray-900">{order.type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de abertura</dt>
                <dd className="mt-1 text-gray-900">{formatDate(order.openedAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de disponibilidade</dt>
                <dd className="mt-1 text-gray-900">
                  {formatDate(order.availabilityAt)}
                </dd>
              </div>
            </dl>
            {order.description && (
              <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
                <dt className="text-gray-500">Descrição</dt>
                <dd className="mt-1 whitespace-pre-wrap text-gray-900">
                  {order.description}
                </dd>
              </div>
            )}
          </div>

          {/* Comentários */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-900">
              Comentários ({order.comments.length})
            </h2>

            {order.comments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum comentário ainda.</p>
            ) : (
              <ul className="space-y-4">
                {order.comments.map((c) => (
                  <li key={c.id} className="border-l-2 border-brand-100 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {c.author.name}
                      </span>
                      <span className="badge bg-gray-100 text-gray-500">
                        {ROLE_LABELS[c.author.role]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {c.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {role && canComment(role) && (
              <form onSubmit={addComment} className="mt-5 border-t border-gray-100 pt-4">
                <textarea
                  className="input min-h-[70px]"
                  placeholder="Escreva um comentário..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                  <button type="submit" className="btn-primary" disabled={posting}>
                    {posting ? "Enviando..." : "Comentar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Ações de status */}
        <div className="space-y-6">
          {role && canChangeStatus(role) && (
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-gray-900">Disponibilidade</h2>
              <p className="mb-3 text-sm text-gray-500">
                Atualize o status desta ordem de serviço.
              </p>
              <div className="space-y-2">
                {order.status !== "CONCLUIDA" && (
                  <button
                    className="btn-primary w-full bg-green-600 hover:bg-green-700"
                    onClick={() => changeStatus("CONCLUIDA")}
                  >
                    ✓ Marcar como concluída
                  </button>
                )}
                {order.status !== "EM_ANDAMENTO" && order.status !== "CONCLUIDA" && (
                  <button
                    className="btn-secondary w-full"
                    onClick={() => changeStatus("EM_ANDAMENTO")}
                  >
                    Marcar em andamento
                  </button>
                )}
                {order.status === "CONCLUIDA" && (
                  <button
                    className="btn-secondary w-full"
                    onClick={() => changeStatus("ABERTA")}
                  >
                    Reabrir ordem
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="card p-5 text-sm">
            <h2 className="mb-3 font-semibold text-gray-900">Informações</h2>
            <p className="text-gray-500">
              Criada por:{" "}
              <span className="text-gray-900">
                {order.createdBy?.name ?? "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {editing && (
        <OrderFormModal
          clients={clients}
          initial={{
            id: order.id,
            title: order.title,
            type: order.type,
            description: order.description,
            clientId: order.client.id,
            status: order.status,
            openedAt: toDateInputValue(order.openedAt),
            availabilityAt: toDateInputValue(order.availabilityAt),
          }}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </div>
  );
}
