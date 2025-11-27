// app/api/pedidos/create/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ============================================================
   Tipos esperados desde el cliente
   ============================================================ */
type ItemBody = {
  sku: string;
  cantidadA: number;
  cantidadB: number;
  cantidadC: number;
  tipo: "NORMAL" | "RESERVA";
  estadoTexto: string | null;
  etaTexto: string | null;
};

type PedidoCreateBody = {
  clienteId?: number;
  comentario?: string | null;
  dispositivo?: string; // PC / Tablet / Celular (opcional)
  items: ItemBody[];
};

/* ============================================================
   POST /api/pedidos/create
   ============================================================ */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PedidoCreateBody;

    const { clienteId, comentario, dispositivo, items } = body;

    /* -----------------------------
       Validaciones básicas
    ------------------------------ */

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No hay items en el pedido." },
        { status: 400 }
      );
    }

    if (!clienteId) {
      return NextResponse.json(
        { ok: false, error: "Falta clienteId." },
        { status: 400 }
      );
    }

    // Validar cantidades no negativas
    for (const it of items) {
      if (
        it.cantidadA < 0 ||
        it.cantidadB < 0 ||
        it.cantidadC < 0
      ) {
        return NextResponse.json(
          { ok: false, error: "Las cantidades no pueden ser negativas." },
          { status: 400 }
        );
      }
    }

    // Opcional: filtrar líneas con todas las cantidades en 0
    const itemsConCantidad = items.filter(
      (i) =>
        (i.cantidadA ?? 0) > 0 ||
        (i.cantidadB ?? 0) > 0 ||
        (i.cantidadC ?? 0) > 0
    );

    if (itemsConCantidad.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No hay cantidades válidas (>0) en el pedido.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------------
       Resolver productos por SKU
       ----------------------------------------------------------- */

    const uniqueSkus = Array.from(
      new Set(itemsConCantidad.map((i) => i.sku))
    );

    const productos = await prisma.producto.findMany({
      where: { sku: { in: uniqueSkus } },
    });

    const mapSkuToProducto = new Map<string, number>();
    for (const p of productos) {
      mapSkuToProducto.set(p.sku, p.id);
    }

    // Verificar que todos los SKUs existan
    const skusNoEncontrados = uniqueSkus.filter(
      (sku) => !mapSkuToProducto.has(sku)
    );

    if (skusNoEncontrados.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Hay SKUs que no existen en catálogo: " +
            skusNoEncontrados.join(", "),
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------------
       Crear pedido en BD
       ----------------------------------------------------------- */

    const pedido = await prisma.pedido.create({
      data: {
        cliente: { connect: { id: clienteId } },
        comentario: comentario ?? null,
        estado: "PENDIENTE",

        // Campo nuevo en schema.prisma
        dispositivo: dispositivo ?? null,

        items: {
          create: itemsConCantidad.map((i) => ({
            productoId: mapSkuToProducto.get(i.sku)!,
            cantidadA: i.cantidadA,
            cantidadB: i.cantidadB,
            cantidadC: i.cantidadC,
            tipo: i.tipo,
            estadoTexto: i.estadoTexto,
            etaTexto: i.etaTexto,
          })),
        },
      },
      include: {
        cliente: true,
        items: true,
      },
    });

    return NextResponse.json({ ok: true, pedido });
  } catch (err) {
    console.error("Error creando pedido:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
