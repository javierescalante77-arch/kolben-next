// app/api/pedidos/create/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clienteId, items } = body;

    if (!clienteId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Datos de pedido inválidos" },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedido.create({
      data: {
        clienteId,
        estado: "PENDIENTE",
        items: {
          create: items.map((item: any) => ({
            codigo: item.codigo,
            descripcion: item.descripcion,
            sucursalA: item.sucursalA ?? 0,
            sucursalB: item.sucursalB ?? 0,
            sucursalC: item.sucursalC ?? 0,
            tipo: item.tipo ?? "normal",
            estadoProd: item.estadoProd ?? null,
            eta: item.eta ?? null,
          })),
        },
      },
      include: {
        items: true,
        cliente: true,
      },
    });

    return NextResponse.json({ ok: true, pedido });
  } catch (error) {
    console.error("Error creando pedido", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al crear el pedido" },
      { status: 500 }
    );
  }
}
