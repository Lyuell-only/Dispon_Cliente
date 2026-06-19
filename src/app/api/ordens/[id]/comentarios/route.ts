import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canComment } from "@/lib/permissions";
import { commentSchema } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canComment(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id: params.id },
  });
  if (!order) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
  }
  if (session.user.role === "EMPRESA" && order.clientId !== session.user.clientId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Comentário inválido" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      orderId: params.id,
      authorId: session.user.id,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
  return NextResponse.json(comment, { status: 201 });
}
