// scripts/seed-productos.cjs
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Productos base Kolben.
 * Aquí puedes ir ampliando la lista con todos tus códigos reales.
 *
 * OJO:
 * - sku: debe ser único (hay constraint UNIQUE en la BD)
 * - tipo: debe ser uno de:
 *   "MAESTRO_FRENOS" | "MAESTRO_CLUTCH" | "AUXILIAR_FRENOS" | "AUXILIAR_CLUTCH" | "PASTILLAS_FRENO"
 * - estado: "DISPONIBLE" | "BAJO_STOCK" | "AGOTADO" | "RESERVA"
 */
const productosBase = [
  {
    sku: "47201-04150",
    marca: "Toyota",
    descripcion: "Tacoma 13/16",
    tipo: "MAESTRO_FRENOS",
    estado: "DISPONIBLE",
    eta: null,
    precio: null,
    imagenes: ["/img/ejemplo1.png"],
  },
  {
    sku: "47201-60460",
    marca: "Toyota",
    descripcion: "22R 1\"",
    tipo: "MAESTRO_FRENOS",
    estado: "DISPONIBLE",
    eta: null,
    precio: null,
    imagenes: ["/img/prueba2.png"],
  },
  // 👉 Aquí irás agregando TODO tu catálogo Kolben poco a poco
];

async function main() {
  console.log("⏳ Iniciando seed de productos Kolben...");

  for (const p of productosBase) {
    const result = await prisma.producto.upsert({
      where: { sku: p.sku },
      update: {
        marca: p.marca,
        descripcion: p.descripcion,
        tipo: p.tipo,
        estado: p.estado,
        eta: p.eta,
        precio: p.precio,
        imagenes: p.imagenes,
      },
      create: {
        sku: p.sku,
        marca: p.marca,
        descripcion: p.descripcion,
        tipo: p.tipo,
        estado: p.estado,
        eta: p.eta,
        precio: p.precio,
        imagenes: p.imagenes,
      },
    });

    console.log(`✔ Producto upsert: ${result.sku}`);
  }

  console.log("✅ Seed de productos completado.");
}

main()
  .catch((err) => {
    console.error("❌ Error en seed de productos:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
