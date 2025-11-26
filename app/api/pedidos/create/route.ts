import { prisma } from "@/lib/prisma";


export async function POST(req: Request) {
  try {
    const { clienteId, items } = await req.json();

    const pedido = await prisma.pedido.create({
      data: {
        clienteId,
        estado: "PENDIENTE",
        items: {
          create: items.map((item: any) => ({
            productoId: item.productoId,  // 👈 OBLIGATORIO
            cantidadA: item.cantidadA ?? 0,
            cantidadB: item.cantidadB ?? 0,
            cantidadC: item.cantidadC ?? 0,
            tipo: item.tipo ?? "NORMAL",

            // Guardamos snapshot de estado/ETA del producto (opcional)
            estadoTexto: item.estadoTexto ?? null,
            etaTexto: item.etaTexto ?? null,
          })),
        },
      },
      include: { items: true }
    });

    return Response.json({ ok: true, data: pedido });
  } catch (err) {
    console.error("Error creando pedido:", err);
    return Response.json({ ok: false, error: "Error creando pedido" }, { status: 500 });
  }
}
