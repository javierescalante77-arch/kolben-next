// app/api/clientes/list/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { id: "asc" },
    });

    const salida = clientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      codigo: c.codigo,
      activo: c.activo,
      sucursales: c.sucursales ?? 1,
    }));

    return NextResponse.json(salida);
  } catch (error) {
    console.error("Error listando clientes:", error);
    return NextResponse.json(
      { error: "Error listando clientes" },
      { status: 500 }
    );
  }
}
