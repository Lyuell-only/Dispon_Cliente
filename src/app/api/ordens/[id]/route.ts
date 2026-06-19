import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageOrders } from "@/lib/permissions";
import { orderUpdateSchema } from "@/lib/validation";
import { parseInputDate } from "@/lib/utils";

async function loadOrderForUser(id: string, user: { role: string; clientId: string | null }) {
  const order = await prisma.serviceOrder.findUnique({ where: { id } });
  if (!order) return { error: "Ordem não encontrada", status: 404 as const };
  if (user.role === "EMPRESA" && order.clientId !== user.clientId) {
    return { error: "Sem permissão", status: 403 as const };
  }
  return { order };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      createdBy: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, role: true } } },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
  }
  if (session.user.role === "EMPRESA" && order.clientId !== session.user.clientId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  return NextResponse.json(order);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageOrders(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const found = await loadOrderForUser(params.id, session.user);
  if ("error" in found) {
    return NextResponse.json({ error: found.error }, { status: found.status });
  }

  const body = await req.json();
  const parsed = orderUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const order = await prisma.serviceOrder.update({
    where: { id: params.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.openedAt !== undefined
        ? { openedAt: parseInputDate(data.openedAt) ?? undefined }
        : {}),
      ...(data.availabilityAt !== undefined
        ? { availabilityAt: parseInputDate(data.availabilityAt) }
        : {}),
    },
    include: { client: true },
  });
  return NextResponse.json(order);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageOrders(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.serviceOrder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
