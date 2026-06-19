import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageOrders, ordersScopeFilter } from "@/lib/permissions";
import { orderCreateSchema } from "@/lib/validation";
import { parseInputDate } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const orders = await prisma.serviceOrder.findMany({
    where: ordersScopeFilter(session.user),
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      _count: { select: { comments: true } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageOrders(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const order = await prisma.serviceOrder.create({
    data: {
      title: data.title,
      type: data.type,
      description: data.description || null,
      clientId: data.clientId,
      status: data.status ?? "ABERTA",
      openedAt: parseInputDate(data.openedAt) ?? new Date(),
      availabilityAt: parseInputDate(data.availabilityAt),
      createdById: session.user.id,
    },
    include: { client: true },
  });
  return NextResponse.json(order, { status: 201 });
}
