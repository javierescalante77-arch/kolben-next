// app/api/pedidos/list/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cliente: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    return Response.json({ ok: true, data: pedidos });
  } catch (err) {
    console.error("Error listando pedidos:", err);
    return Response.json(
      { ok: false, error: "Error listando pedidos" },
      { status: 500 }
    );
  }
}
