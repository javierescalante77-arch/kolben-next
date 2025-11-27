// app/api/productos/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type TipoProducto =
  | "MAESTRO_FRENOS"
  | "MAESTRO_CLUTCH"
  | "AUXILIAR_FRENOS"
  | "AUXILIAR_CLUTCH"
  | "PASTILLAS_FRENO";

type EstadoProducto = "DISPONIBLE" | "BAJO_STOCK" | "AGOTADO" | "RESERVA";

type SavePayload = {
  id?: number | null;
  sku: string;
  marca: string;
  descripcion: string;
  tipo: TipoProducto;
  estado: EstadoProducto;
  eta?: string | null;
  precio?: number | null;
  imagenes?: string[] | null;
};

function validarPayload(data: any): { ok: true; value: SavePayload } | { ok: false; error: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Body inválido" };
  }

  const {
    id,
    sku,
    marca,
    descripcion,
    tipo,
    estado,
    eta,
    precio,
    imagenes,
  } = data as SavePayload;

  if (!sku || typeof sku !== "string" || !sku.trim()) {
    return { ok: false, error: "El SKU es obligatorio" };
  }
  if (!marca || typeof marca !== "string" || !marca.trim()) {
    return { ok: false, error: "La marca es obligatoria" };
  }
  if (!descripcion || typeof descripcion !== "string" || !descripcion.trim()) {
    return { ok: false, error: "La descripción es obligatoria" };
  }

  const tiposValidos: TipoProducto[] = [
    "MAESTRO_FRENOS",
    "MAESTRO_CLUTCH",
    "AUXILIAR_FRENOS",
    "AUXILIAR_CLUTCH",
    "PASTILLAS_FRENO",
  ];
  if (!tiposValidos.includes(tipo)) {
    return { ok: false, error: "Tipo de producto inválido" };
  }

  const estadosValidos: EstadoProducto[] = [
    "DISPONIBLE",
    "BAJO_STOCK",
    "AGOTADO",
    "RESERVA",
  ];
  if (!estadosValidos.includes(estado)) {
    return { ok: false, error: "Estado de producto inválido" };
  }

  let precioNumber: number | null = null;
  if (precio !== undefined && precio !== null) {
    const parsed = Number(precio);
    if (Number.isNaN(parsed) || parsed < 0) {
      return { ok: false, error: "Precio inválido" };
    }
    precioNumber = parsed;
  }


  let imagenesArray: string[] | null = null;
  if (Array.isArray(imagenes)) {
    imagenesArray = imagenes
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }

  const etaFinal =
    estado === "RESERVA" && typeof eta === "string" && eta.trim()
      ? eta.trim()
      : null;

  const idFinal =
    typeof id === "number" && Number.isInteger(id) ? id : undefined;

  return {
    ok: true,
    value: {
      id: idFinal,
      sku: sku.trim(),
      marca: marca.trim(),
      descripcion: descripcion.trim(),
      tipo,
      estado,
      eta: etaFinal,
      precio: precioNumber ?? null,
      imagenes: imagenesArray,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const valid = validarPayload(json);

    if (!valid.ok) {
      return NextResponse.json(
        { ok: false, error: valid.error },
        { status: 400 }
      );
    }

    const data = valid.value;

    // Si no es RESERVA, nos aseguramos de limpiar eta
    if (data.estado !== "RESERVA") {
      data.eta = null;
    }

    let producto;

    if (data.id) {
      // UPDATE
      producto = await prisma.producto.update({
        where: { id: data.id },
        data: {
          sku: data.sku,
          marca: data.marca,
          descripcion: data.descripcion,
          tipo: data.tipo,
          estado: data.estado,
          eta: data.eta,
          precio: data.precio,
          imagenes: data.imagenes as any, // según cómo tengas definido el campo en Prisma
        },
      });
    } else {
      // CREATE
      producto = await prisma.producto.create({
        data: {
          sku: data.sku,
          marca: data.marca,
          descripcion: data.descripcion,
          tipo: data.tipo,
          estado: data.estado,
          eta: data.eta,
          precio: data.precio,
          imagenes: data.imagenes as any,
        },
      });
    }

    return NextResponse.json({ ok: true, data: producto });
  } catch (err: any) {
    console.error("[POST /api/productos/save] Error:", err);

    // SKU duplicado (P2002 en Prisma)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002" && (err.meta?.target as string[])?.includes("sku")) {
        return NextResponse.json(
          { ok: false, error: "Ya existe un producto con ese SKU" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { ok: false, error: "Error al guardar el producto" },
      { status: 500 }
    );
  }
}
