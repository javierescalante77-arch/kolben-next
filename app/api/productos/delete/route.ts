// app/api/productos/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    const idNum = Number(id);
    if (!idNum || !Number.isInteger(idNum)) {
      return NextResponse.json(
        { ok: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    // Opcional: bloquear si tiene items asociados
    let tieneItems = false;
    try {
      // Ajusta el nombre del modelo/relación si difiere
      const count = await prisma.pedidoItem.count({
        where: { productoId: idNum },
      });
      tieneItems = count > 0;
    } catch {
      // Si el modelo no existe o cambia el nombre, simplemente ignoramos el check
      tieneItems = false;
    }

    if (tieneItems) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se puede eliminar: el producto tiene pedidos asociados.",
        },
        { status: 400 }
      );
    }

    await prisma.producto.delete({
      where: { id: idNum },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/productos/delete] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}
