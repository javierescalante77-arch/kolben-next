// app/api/clientes/save/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Body esperado (JSON):
 * {
 *   id?: number;        // si viene, actualiza; si no, crea
 *   nombre: string;
 *   codigo: string;
 *   activo?: boolean;
 *   sucursales?: number; // 1,2 o 3
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = body.id as number | undefined;
    const nombre = String(body.nombre ?? "").trim();
    const codigo = String(body.codigo ?? "").trim();
    const activo =
      typeof body.activo === "boolean" ? body.activo : true;

    let sucursales = Number(body.sucursales ?? 1);
    if (![1, 2, 3].includes(sucursales)) {
      sucursales = 1;
    }

    if (!nombre || !codigo) {
      return NextResponse.json(
        { error: "Nombre y código son obligatorios." },
        { status: 400 }
      );
    }

    const claveHashTemporal = "PENDIENTE_LOGIN_REAL";

    let cliente;

    if (id) {
      // Actualizar
      cliente = await prisma.cliente.update({
        where: { id },
        data: {
          nombre,
          codigo,
          activo,
          sucursales,
        },
      });
    } else {
      // Crear
      cliente = await prisma.cliente.create({
        data: {
          nombre,
          codigo,
          activo,
          sucursales,
          claveHash: claveHashTemporal,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        codigo: cliente.codigo,
        activo: cliente.activo,
        sucursales: cliente.sucursales,
      },
    });
  } catch (error: any) {
    console.error("Error guardando cliente:", error);

    if (
      error?.code === "P2002" ||
      (typeof error.message === "string" &&
        error.message.includes("Unique constraint"))
    ) {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese código." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error guardando cliente." },
      { status: 500 }
    );
  }
}
