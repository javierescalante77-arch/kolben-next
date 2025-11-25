// app/api/pedidos/delete/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pedidoId } = body;

    if (!pedidoId) {
      return NextResponse.json(
        { ok: false, error: "Falta ID de pedido" },
        { status: 400 }
      );
    }

    // Borramos primero los items por integridad
    await prisma.pedidoItem.deleteMany({
      where: { pedidoId: Number(pedidoId) },
    });

    await prisma.pedido.delete({
      where: { id: Number(pedidoId) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando pedido", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al eliminar pedido" },
      { status: 500 }
    );
  }
}
