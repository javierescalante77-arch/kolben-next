// app/api/pedidos/create/route.ts
import { prisma } from "@/lib/prisma";

type CreatePedidoItem = {
  sku: string;
  cantidadA?: number;
  cantidadB?: number;
  cantidadC?: number;
  tipo?: "NORMAL" | "RESERVA";
  estadoTexto?: string | null;
  etaTexto?: string | null;
};

type CreatePedidoBody = {
  clienteId?: number | string;
  comentario?: string;
  dispositivo?: string;
  items: CreatePedidoItem[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreatePedidoBody;

    // 1) Validar que hay items
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return Response.json(
        { ok: false, error: "El pedido no tiene productos." },
        { status: 400 }
      );
    }

    // 2) Resolver clienteId (usa el enviado o el primer cliente activo)
    let clienteIdFinal: number | null = null;

    if (body.clienteId != null) {
      const parsed = Number(body.clienteId);
      if (!Number.isNaN(parsed) && parsed > 0) {
        clienteIdFinal = parsed;
      }
    }

    if (!clienteIdFinal) {
      const clienteActivo = await prisma.cliente.findFirst({
        where: { activo: true },
        orderBy: { id: "asc" },
      });

      if (!clienteActivo) {
        return Response.json(
          {
            ok: false,
            error: "No hay cliente activo para asociar el pedido.",
          },
          { status: 400 }
        );
      }

      clienteIdFinal = clienteActivo.id;
    }

    // 3) Resolver productos por SKU (una sola consulta)
    const skus = Array.from(
      new Set(
        body.items
          .map((it) => String(it.sku ?? "").trim())
          .filter((s) => s.length > 0)
      )
    );

    if (skus.length === 0) {
      return Response.json(
        { ok: false, error: "Los items del pedido no tienen SKU válido." },
        { status: 400 }
      );
    }

    const productos = await prisma.producto.findMany({
      where: { sku: { in: skus } },
    });

    const skuToId = new Map(productos.map((p) => [p.sku, p.id]));

    // Verificar que todos los SKUs realmente existen
    for (const it of body.items) {
      const key = String(it.sku ?? "").trim();
      if (!skuToId.has(key)) {
        return Response.json(
          {
            ok: false,
            error: `Producto con SKU "${key}" no existe en la base de datos.`,
          },
          { status: 400 }
        );
      }
    }

    // 4) Crear pedido + líneas
    const pedido = await prisma.pedido.create({
      data: {
        clienteId: clienteIdFinal,
        comentario: body.comentario ?? null,
        dispositivoOrigen: body.dispositivo ?? null,
        estado: "PENDIENTE",
        items: {
          create: body.items.map((it) => {
            const key = String(it.sku ?? "").trim();
            return {
              productoId: skuToId.get(key)!,
              cantidadA: it.cantidadA ?? 0,
              cantidadB: it.cantidadB ?? 0,
              cantidadC: it.cantidadC ?? 0,
              tipo: it.tipo === "RESERVA" ? "RESERVA" : "NORMAL",
              estadoTexto: it.estadoTexto ?? null,
              etaTexto: it.etaTexto ?? null,
            };
          }),
        },
      },
      include: {
        cliente: true,
        items: {
          include: { producto: true },
        },
      },
    });

    return Response.json({ ok: true, data: pedido });
  } catch (err) {
    console.error("Error creando pedido:", err);
    return Response.json(
      { ok: false, error: "Error creando pedido" },
      { status: 500 }
    );
  }
}
