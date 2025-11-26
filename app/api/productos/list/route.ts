// app/api/productos/list/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Tipos del lado frontend
type Status = "disponible" | "bajo" | "agotado" | "reserva";

type TipoFrontend =
  | "todo"
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch"
  | "pastillas_freno";

type ProductDTO = {
  id: string;
  sku: string;
  brand: string;
  desc: string;
  status: Status;
  eta?: string;
  type: TipoFrontend;
  imgs: string[];
};

// Valores que esperamos desde la BD (enums Prisma) pero tratados como string
type EstadoDb = "DISPONIBLE" | "BAJO_STOCK" | "AGOTADO" | "RESERVA";
type TipoDb =
  | "MAESTRO_FRENOS"
  | "MAESTRO_CLUTCH"
  | "AUXILIAR_FRENOS"
  | "AUXILIAR_CLUTCH"
  | "PASTILLAS_FRENO";

function mapEstado(estado: EstadoDb): Status {
  switch (estado) {
    case "DISPONIBLE":
      return "disponible";
    case "BAJO_STOCK":
      return "bajo";
    case "AGOTADO":
      return "agotado";
    case "RESERVA":
      return "reserva";
    default:
      return "disponible";
  }
}

function mapTipo(tipo: TipoDb): TipoFrontend {
  switch (tipo) {
    case "MAESTRO_FRENOS":
      return "maestro_frenos";
    case "MAESTRO_CLUTCH":
      return "maestro_clutch";
    case "AUXILIAR_FRENOS":
      return "auxiliar_frenos";
    case "AUXILIAR_CLUTCH":
      return "auxiliar_clutch";
    case "PASTILLAS_FRENO":
      return "pastillas_freno";
    default:
      return "todo";
  }
}

function mapImagenes(imagenes: unknown): string[] {
  if (!imagenes) return [];
  if (Array.isArray(imagenes) && imagenes.every((x) => typeof x === "string")) {
    return imagenes as string[];
  }
  return [];
}

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { id: "asc" },
    });

    const data: ProductDTO[] = productos.map((p: any) => ({
      id: String(p.id),
      sku: p.sku,
      brand: p.marca,
      desc: p.descripcion,
      status: mapEstado(p.estado as EstadoDb),
      eta: p.eta ?? undefined,
      type: mapTipo(p.tipo as TipoDb),
      imgs: mapImagenes(p.imagenes),
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Error cargando productos:", err);
    return new NextResponse("Error cargando productos", { status: 500 });
  }
}
