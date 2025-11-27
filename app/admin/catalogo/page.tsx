"use client";

import { useEffect, useMemo, useState } from "react";
import "../admin.css";

/* ========= Tipos alineados con /api/productos/list ========= */

type ProductStatus = "disponible" | "bajo" | "agotado" | "reserva";

type ProductType =
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch"
  | "pastillas_freno";

type Product = {
  id: number;
  sku: string;
  brand: string;
  desc: string;
  status: ProductStatus;
  type: ProductType;
  imgs: string[];
  eta?: string;
};

type StatusFilter = "todos" | ProductStatus;
type TypeFilter = "todos" | ProductType;

/* ========= Labels y helpers ========= */

const STATUS_LABEL: Record<ProductStatus, string> = {
  disponible: "Disponible",
  bajo: "Bajo stock",
  agotado: "Agotado",
  reserva: "Reservar (en camino)",
};

const TYPE_LABEL: Record<ProductType, string> = {
  maestro_frenos: "Maestro de frenos",
  maestro_clutch: "Maestro de clutch",
  auxiliar_frenos: "Auxiliar de frenos",
  auxiliar_clutch: "Auxiliar de clutch",
  pastillas_freno: "Pastillas de freno",
};

function getStatusClass(status: ProductStatus) {
  switch (status) {
    case "disponible":
      return "pill pill-disponible";
    case "bajo":
      return "pill pill-bajo";
    case "agotado":
      return "pill pill-agotado";
    case "reserva":
      return "pill pill-reserva";
    default:
      return "pill";
  }
}

/* ========= Página principal ========= */

export default function AdminCatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/productos/list");
        if (!res.ok) {
          throw new Error("Error HTTP " + res.status);
        }

        const json = await res.json();
        const data = (json?.data ?? []) as Product[];

        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Error cargando productos en admin/catalogo:", err);
        if (!cancelled) {
          setError("No se pudieron cargar los productos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        TYPE_LABEL[p.type].toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "todos" ? true : p.status === statusFilter;

      const matchesType =
        typeFilter === "todos" ? true : p.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [products, search, statusFilter, typeFilter]);

  return (
    <main className="container">
      <section className="panel">
        {/* Encabezado */}
        <div className="catalog-admin-header">
          <div>
            <h1 className="catalog-admin-title">Catálogo</h1>
            <p className="catalog-admin-subtitle">
              Visor de productos Kolben cargados en la base de datos Neon.
            </p>
          </div>

          <div className="catalog-admin-meta">
            <span className="badge-count">
              {filtered.length} producto
              {filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="catalog-admin-filters">
          <input
            className="catalog-admin-input"
            type="text"
            placeholder="Buscar por código, marca o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="catalog-admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="todos">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="bajo">Bajo stock</option>
            <option value="agotado">Agotado</option>
            <option value="reserva">Reservar (en camino)</option>
          </select>

          <select
            className="catalog-admin-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          >
            <option value="todos">Todos los tipos</option>
            <option value="maestro_frenos">Maestro de frenos</option>
            <option value="maestro_clutch">Maestro de clutch</option>
            <option value="auxiliar_frenos">Auxiliar de frenos</option>
            <option value="auxiliar_clutch">Auxiliar de clutch</option>
            <option value="pastillas_freno">Pastillas de freno</option>
          </select>
        </div>

        {/* Contenido */}
        {loading && <p>Cargando productos…</p>}

        {!loading && error && (
          <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
            No hay productos que coincidan con los filtros.
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>SKU</th>
                  <th>Marca</th>
                  <th>Descripción</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Imágenes</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.sku}</td>
                    <td>{p.brand}</td>
                    <td>{p.desc}</td>
                    <td>{TYPE_LABEL[p.type]}</td>
                    <td>
                      <span className={getStatusClass(p.status)}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td>
                      {p.imgs && p.imgs.length > 0 ? (
                        <div className="catalog-thumb-wrapper">
                          <img
                            src={p.imgs[0]}
                            alt={p.sku}
                            className="catalog-thumb"
                          />
                          {p.imgs.length > 1 && (
                            <span className="catalog-thumb-count">
                              +{p.imgs.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="catalog-no-image">Sin imagen</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
