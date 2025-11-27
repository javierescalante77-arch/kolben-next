// app/api/pedidos/delete/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { ok: false, error: "Falta el parámetro 'id' en la URL." },
        { status: 400 }
      );
    }

    const pedidoId = Number(idParam);
    if (Number.isNaN(pedidoId)) {
      return NextResponse.json(
        { ok: false, error: "ID de pedido inválido." },
        { status: 400 }
      );
    }

    // 1) Verificar que el pedido existe
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { id: true, estado: true },
    });

    if (!pedido) {
      return NextResponse.json(
        { ok: false, error: "Pedido no encontrado." },
        { status: 404 }
      );
    }

    // 2) Regla de negocio:
    //    Solo permitir eliminar pedidos en estado ENVIADO.
    //    (Si luego quieres permitir también PENDIENTE o RECIBIDO, se ajusta aquí.)
    if (pedido.estado !== "ENVIADO") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Solo se pueden eliminar pedidos que ya están en estado 'Enviado'.",
        },
        { status: 400 }
      );
    }

    // 3) Eliminar primero los items, luego el pedido
    //    (por si no tienes ON DELETE CASCADE en la base)
    await prisma.pedidoItem.deleteMany({
      where: { pedidoId },
    });

    await prisma.pedido.delete({
      where: { id: pedidoId },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error eliminando pedido:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Error interno al eliminar el pedido.",
      },
      { status: 500 }
    );
  }
}

