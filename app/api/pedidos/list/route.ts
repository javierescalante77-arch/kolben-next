// app/api/pedidos/list/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { creadoEn: "desc" },
      include: {
        cliente: true,
        items: true,
      },
    });

    return NextResponse.json({ ok: true, pedidos });
  } catch (error) {
    console.error("Error listando pedidos", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al listar pedidos" },
      { status: 500 }
    );
  }
}
