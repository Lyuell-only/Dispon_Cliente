import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import { canManageOrders, ROLE_LABELS } from "@/lib/permissions";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatDateTime,
  formatCliente,
} from "@/lib/utils";
import { prestadoraNome } from "@/config/prestadoras";
import { OrderFormModal } from "@/components/OrderFormModal";
import type { Comment, ServiceOrder } from "@/lib/types";

export default function OrdemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, session } = useAuth();

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: o }, { data: c }] = await Promise.all([
      supabase.from("service_orders").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("comments")
        .select("*, author:profiles(name, role)")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setOrder((o as ServiceOrder) ?? null);
    setComments((c as Comment[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: string) {
    const { error } = await supabase.rpc("set_order_status", {
      p_order: id,
      p_status: status,
    });
    if (!error) load();
    else alert(error.message);
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      order_id: id,
      author_id: session?.user.id,
      body: body.trim(),
    });
    setPosting(false);
    if (!error) {
      setBody("");
      load();
    } else {
      alert(error.message);
    }
  }

  async function handleDelete() {
    if (!confirm("Excluir esta ordem de serviço?")) return;
    const { error } = await supabase.from("service_orders").delete().eq("id", id);
    if (!error) navigate("/ordens");
    else alert(error.message);
  }

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;
  if (!order) {
    return (
      <div>
        <p className="text-sm text-gray-500">Ordem não encontrada.</p>
        <Link to="/ordens" className="text-sm text-brand-600 hover:underline">
          ← Voltar
        </Link>
      </div>
    );
  }

  const isManager = profile ? canManageOrders(profile.role) : false;

  return (
    <div>
      <Link
        to="/ordens"
        className="mb-4 inline-block text-sm text-brand-600 hover:underline"
      >
        ← Voltar para ordens
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {formatCliente(order.client_code, order.client_name)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {order.cidade} · {order.tipo}
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              Editar
            </button>
            <button className="btn-danger" onClick={handleDelete}>
              Excluir
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
                <dt className="text-gray-500">Prestadora</dt>
                <dd className="mt-1 text-gray-900">
                  {prestadoraNome(order.prestadora_id)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de abertura</dt>
                <dd className="mt-1 text-gray-900">{formatDate(order.opened_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de disponibilidade</dt>
                <dd className="mt-1 text-gray-900">
                  {formatDate(order.availability_at)}
                </dd>
              </div>
            </dl>
            {order.observacao && (
              <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
                <dt className="text-gray-500">Observação</dt>
                <dd className="mt-1 whitespace-pre-wrap text-gray-900">
                  {order.observacao}
                </dd>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-900">
              Comentários ({comments.length})
            </h2>

            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum comentário ainda.</p>
            ) : (
              <ul className="space-y-4">
                {comments.map((c) => (
                  <li key={c.id} className="border-l-2 border-brand-100 pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {c.author?.name ?? "Usuário"}
                      </span>
                      {c.author?.role && (
                        <span className="badge bg-gray-100 text-gray-500">
                          {ROLE_LABELS[c.author.role]}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDateTime(c.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {c.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={addComment} className="mt-5 border-t border-gray-100 pt-4">
              <textarea
                className="input min-h-[70px]"
                placeholder="Escreva um comentário..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <button type="submit" className="btn-primary" disabled={posting}>
                  {posting ? "Enviando..." : "Comentar"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Disponibilidade</h2>
            <p className="mb-3 text-sm text-gray-500">
              Atualize o status desta ordem de serviço.
            </p>
            <div className="space-y-2">
              {order.status !== "CONCLUIDA" && (
                <button
                  className="btn w-full bg-green-600 text-white hover:bg-green-700"
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
        </div>
      </div>

      {editing && (
        <OrderFormModal
          order={order}
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
