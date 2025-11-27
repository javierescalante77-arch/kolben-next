import { prisma } from "@/lib/prisma";

type BodyProducto = {
  id?: number;
  sku: string;
  marca: string;
  descripcion: string;
  tipo: "MAESTRO_FRENOS" | "MAESTRO_CLUTCH" | "AUXILIAR_FRENOS" | "AUXILIAR_CLUTCH" | "PASTILLAS_FRENO";
  estado: "DISPONIBLE" | "BAJO_STOCK" | "AGOTADO" | "RESERVA";
  eta?: string | null;
  precio?: number | null;
  imagenes?: string[]; // URLs limpias
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BodyProducto;

    const {
      id,
      sku,
      marca,
      descripcion,
      tipo,
      estado,
      eta = null,
      precio = null,
      imagenes = [],
    } = body;

    // Validaciones mínimas
    if (!sku || !marca || !descripcion || !tipo || !estado) {
      return Response.json(
        { ok: false, error: "Faltan campos obligatorios (sku, marca, descripción, tipo, estado)." },
        { status: 400 }
      );
    }

    // Normalizar imágenes: quitar vacíos
const imgsClean = Array.isArray(imagenes)
  ? imagenes.filter((url) => typeof url === "string" && url.trim().length > 0)
  : [];

// Prisma JSON requiere un JsonValue.
// Convertimos el array en JsonValue explícito.
const data = {
  sku: sku.trim(),
  marca: marca.trim(),
  descripcion: descripcion.trim(),
  tipo,
  estado,
  eta: eta?.trim() || null,
  precio: typeof precio === "number" ? precio : null,
  imagenes: imgsClean.length > 0 ? (imgsClean as any) : null,
};


    let producto;

    if (id) {
      // EDITAR
      producto = await prisma.producto.update({
        where: { id },
        data,
      });
    } else {
      // CREAR
      producto = await prisma.producto.create({
        data,
      });
    }

    return Response.json({ ok: true, data: producto });
  } catch (err: any) {
    console.error("Error guardando producto:", err);

    // Error de SKU duplicado (constraint UNIQUE)
    if (err?.code === "P2002") {
      return Response.json(
        { ok: false, error: "Ya existe un producto con ese SKU." },
        { status: 400 }
      );
    }

    return Response.json(
      { ok: false, error: "Error interno guardando el producto." },
      { status: 500 }
    );
  }
}
