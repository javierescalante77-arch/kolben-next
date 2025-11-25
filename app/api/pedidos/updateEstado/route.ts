// app/api/pedidos/updateEstado/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pedidoId, estado } = body;

    if (!pedidoId || !estado) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedido.update({
      where: { id: Number(pedidoId) },
      data: { estado },
    });

    return NextResponse.json({ ok: true, pedido });
  } catch (error) {
    console.error("Error actualizando estado", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al actualizar el estado" },
      { status: 500 }
    );
  }
}
