import type { OrderStatus } from "./types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  ABERTA: "bg-blue-100 text-blue-700",
  EM_ANDAMENTO: "bg-amber-100 text-amber-700",
  CONCLUIDA: "bg-green-100 text-green-700",
  CANCELADA: "bg-gray-200 text-gray-600",
};

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Lê o campo de cliente no formato "(231232) CLIENTE TALTALTAL" e separa
 * código e nome. Se não casar o formato, devolve tudo como nome.
 */
export function parseCliente(input: string): {
  code: string | null;
  name: string;
} {
  const m = input.trim().match(/^\((\d+)\)\s*(.+)$/);
  if (m) {
    return { code: m[1], name: m[2].trim() };
  }
  return { code: null, name: input.trim() };
}

/** Monta de volta a string "(codigo) NOME" para exibição/edição. */
export function formatCliente(
  code: string | null | undefined,
  name: string
): string {
  return code ? `(${code}) ${name}` : name;
}
