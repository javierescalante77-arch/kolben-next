// app/api/clientes/delete/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Body esperado (JSON):
 * { id: number }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido." },
        { status: 400 }
      );
    }

    await prisma.cliente.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error eliminando cliente:", error);

    if (
      typeof error.message === "string" &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json(
        { error: "El cliente ya no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error eliminando cliente." },
      { status: 500 }
    );
  }
}
