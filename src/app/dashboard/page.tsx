import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ordersScopeFilter } from "@/lib/permissions";
import { STATUS_LABELS, STATUS_STYLES, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const scope = ordersScopeFilter(session!.user);

  const [total, abertas, emAndamento, concluidas, recentes] = await Promise.all([
    prisma.serviceOrder.count({ where: scope }),
    prisma.serviceOrder.count({ where: { ...scope, status: "ABERTA" } }),
    prisma.serviceOrder.count({ where: { ...scope, status: "EM_ANDAMENTO" } }),
    prisma.serviceOrder.count({ where: { ...scope, status: "CONCLUIDA" } }),
    prisma.serviceOrder.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: true },
    }),
  ]);

  const cards = [
    { label: "Total de ordens", value: total, color: "text-gray-900" },
    { label: "Abertas", value: abertas, color: "text-blue-600" },
    { label: "Em andamento", value: emAndamento, color: "text-amber-600" },
    { label: "Concluídas", value: concluidas, color: "text-green-600" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Visão geral</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`mt-1 text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Ordens recentes</h2>
          <Link href="/dashboard/ordens" className="text-sm text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>

        {recentes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nenhuma ordem de serviço cadastrada.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentes.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/ordens/${o.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{o.title}</p>
                    <p className="text-sm text-gray-500">
                      {o.client.name} · {o.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden text-sm text-gray-500 sm:block">
                      Disp.: {formatDate(o.availabilityAt)}
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
