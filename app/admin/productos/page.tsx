"use client";

import { useState } from "react";
import "../../cliente/cliente.css";

type ProductStatus =
  | "Disponible"
  | "Bajo stock"
  | "Agotado"
  | "Reservar (en camino)";

type ProductCategory =
  | "Maestro de frenos"
  | "Maestro de clutch"
  | "Auxiliar de frenos"
  | "Auxiliar de clutch"
  | "Pastillas de freno";

type AdminProduct = {
  id: number;
  position: number;
  brand: string;
  sku: string;
  desc: string;
  category: ProductCategory;
  status: ProductStatus;
  eta: string; // fecha (YYYY-MM-DD) cuando es "Reservar"
};

const initialProducts: AdminProduct[] = [
  {
    id: 1,
    position: 1,
    brand: "Toyota",
    sku: "47201-60460",
    desc: "Cilindro maestro Corolla 3 tornillos 13/16",
    category: "Maestro de frenos",
    status: "Reservar (en camino)",
    eta: "2025-12-10",
  },
  {
    id: 2,
    position: 2,
    brand: "Toyota",
    sku: "47201-04150",
    desc: "Tacoma 05–15 Automático 15/16",
    category: "Maestro de frenos",
    status: "Disponible",
    eta: "",
  },
  {
    id: 3,
    position: 3,
    brand: "Nissan",
    sku: "47210-AD200",
    desc: "Cilindro maestro Tiida 95–05 aluminio",
    category: "Maestro de frenos",
    status: "Bajo stock",
    eta: "",
  },
];

export default function AdminProductosPage() {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);

  const handleFieldChange = (
    id: number,
    field: keyof AdminProduct,
    value: string
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              [field]:
                field === "position" ? Number(value) || 0 : (value as any),
            }
          : p
      )
    );
  };

  const handleNewProduct = () => {
    const nextId = products.length
      ? Math.max(...products.map((p) => p.id)) + 1
      : 1;
    const nextPos = products.length
      ? Math.max(...products.map((p) => p.position)) + 1
      : 1;

    setProducts((prev) => [
      ...prev,
      {
        id: nextId,
        position: nextPos,
        brand: "",
        sku: "",
        desc: "",
        category: "Maestro de frenos",
        status: "Disponible",
        eta: "",
      },
    ]);
  };

  const handleDeleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    // Aquí más adelante llamaremos a una API / Prisma.
    // Por ahora solo mostramos en consola y un aviso.
    // eslint-disable-next-line no-console
    console.log("Productos a guardar (demo):", products);
    alert(
      "Cambios guardados (demo). Más adelante se conectará a la base de datos."
    );
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      {/* Encabezado + acciones globales */}
      <div className="panel admin-products-header">
        <div className="admin-products-header-inner">
          <div className="admin-products-header-text">
            <h1 style={{ margin: 0 }}>Productos</h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              Listado de productos Kolben. Más adelante estos registros se
              guardarán en la base de datos.
            </p>
          </div>

          <div className="admin-products-header-actions">
            <button className="btn light" onClick={handleNewProduct}>
              + Nuevo
            </button>
            <button className="btn primary" onClick={handleSave}>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      {/* Grid de tarjetas 2×N (1×N en móvil, controlado por CSS) */}
      <div className="admin-products-grid">
        {products.map((p) => (
          <div key={p.id} className="panel product-card">
            {/* Posición + borrar (desktop) */}
            <div className="product-card-top">
              <div className="product-pos">
                <span className="product-pos-label"># Posición</span>
                <input
                  type="number"
                  className="input product-pos-input"
                  value={p.position}
                  onChange={(e) =>
                    handleFieldChange(p.id, "position", e.target.value)
                  }
                />
              </div>

              {/* Botón eliminar solo escritorio (móvil se controla por CSS) */}
              <button
                className="btn-ghost product-delete-desktop"
                type="button"
                onClick={() => handleDeleteProduct(p.id)}
              >
                Eliminar
              </button>
            </div>

            {/* Marca */}
            <div className="product-field">
              <div className="product-field-label">Marca</div>
              <input
                className="input"
                value={p.brand}
                onChange={(e) =>
                  handleFieldChange(p.id, "brand", e.target.value)
                }
              />
            </div>

            {/* SKU */}
            <div className="product-field">
              <div className="product-field-label">SKU</div>
              <input
                className="input"
                value={p.sku}
                onChange={(e) =>
                  handleFieldChange(p.id, "sku", e.target.value)
                }
              />
            </div>

            {/* Descripción */}
            <div className="product-field">
              <div className="product-field-label">Descripción</div>
              <textarea
                className="input"
                rows={3}
                value={p.desc}
                onChange={(e) =>
                  handleFieldChange(p.id, "desc", e.target.value)
                }
              />
            </div>

            {/* Categoría / Estado / ETA */}
            <div className="product-grid-3">
              {/* Categoría */}
              <div className="product-field">
                <div className="product-field-label">Categoría</div>
                <select
                  className="input"
                  value={p.category}
                  onChange={(e) =>
                    handleFieldChange(
                      p.id,
                      "category",
                      e.target.value as ProductCategory
                    )
                  }
                >
                  <option>Maestro de frenos</option>
                  <option>Maestro de clutch</option>
                  <option>Auxiliar de frenos</option>
                  <option>Auxiliar de clutch</option>
                  <option>Pastillas de freno</option>
                </select>
              </div>

              {/* Estado */}
              <div className="product-field">
                <div className="product-field-label">Estado</div>
                <select
                  className="input"
                  value={p.status}
                  onChange={(e) =>
                    handleFieldChange(
                      p.id,
                      "status",
                      e.target.value as ProductStatus
                    )
                  }
                >
                  <option>Disponible</option>
                  <option>Bajo stock</option>
                  <option>Agotado</option>
                  <option>Reservar (en camino)</option>
                </select>
              </div>

              {/* ETA */}
              <div className="product-field">
                <div className="product-field-label">ETA (Reservar)</div>
                <input
                  type="date"
                  className="input"
                  disabled={p.status !== "Reservar (en camino)"}
                  value={p.eta}
                  onChange={(e) =>
                    handleFieldChange(p.id, "eta", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Imágenes – estructura con miniaturas (foto mini) */}
            <div className="product-field product-images-block">
              <div className="product-field-label">Imágenes</div>

              <div className="product-images-row">
                <button
                  type="button"
                  className="btn light"
                  // Más adelante conectaremos aquí el uploader real
                >
                  Subir imágenes
                </button>

                {/* Placeholder de hasta 3 miniaturas.
                    Luego se reemplazará por thumbnails reales cuando
                    integremos storage. */}
                <div className="product-thumbs">
                  <div className="product-thumb">+</div>
                  <div className="product-thumb">+</div>
                  <div className="product-thumb">+</div>
                </div>
              </div>
            </div>

            {/* Botón eliminar versión móvil (abajo a la derecha) */}
            <div className="product-card-footer">
              <button
                className="btn-ghost product-delete-mobile"
                type="button"
                onClick={() => handleDeleteProduct(p.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Nota inferior */}
      <p
        style={{
          fontSize: 13,
          color: "#6b7280",
          marginTop: 16,
        }}
      >
        * La columna <strong>Posición</strong> controla el orden en que se
        muestran las tarjetas en el catálogo. Más adelante se guardará en la
        base de datos.
      </p>
    </div>
  );
}
