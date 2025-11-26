"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import "./productos.css";
import "../admin.css";

/* ================== Tipos alineados con /api/productos/list ================== */

type ProductStatus = "disponible" | "bajo" | "agotado" | "reserva";

type ProductType =
  | "todo"
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch"
  | "pastillas_freno";

type Product = {
  id: string;
  sku: string;
  brand: string;
  desc: string;
  status: ProductStatus;
  eta?: string;
  type: ProductType;
  imgs: string[];
};

type ApiResponse = {
  ok: boolean;
  data?: Product[];
  error?: string;
};

/* ================== Página Admin / Productos ================== */

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProductType>("todo");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "todos">(
    "todos"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/productos/list", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const json = (await res.json()) as ApiResponse;

        if (!json.ok || !json.data) {
          throw new Error(json.error || "Error cargando productos");
        }

        if (!cancelled) {
          setProducts(json.data);
        }
      } catch (e: any) {
        console.error("Error cargando productos en admin:", e);
        if (!cancelled) {
          setError(e?.message ?? "Error cargando productos");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (typeFilter !== "todo" && p.type !== typeFilter) return false;
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;

      if (!term) return true;

      const haystack =
        (p.sku + " " + p.brand + " " + p.desc).toLowerCase().normalize("NFD");
      const needle = term.normalize("NFD");
      return haystack.includes(needle);
    });
  }, [products, search, typeFilter, statusFilter]);

  const total = products.length;
  const totalDisponible = products.filter((p) => p.status === "disponible").length;
  const totalReserva = products.filter((p) => p.status === "reserva").length;

  return (
    <main className="container">
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 4 }}>Productos</h1>
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            Visor administrativo de productos reales (Neon).
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Total: <strong>{total}</strong> · Disponibles:{" "}
            <strong>{totalDisponible}</strong> · En reserva:{" "}
            <strong>{totalReserva}</strong>
          </div>
        </div>

        {/* Filtros */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <input
            className="input"
            style={{ minWidth: 160, fontSize: 13 }}
            placeholder="Buscar SKU / marca / descripción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="input"
            style={{ minWidth: 140, fontSize: 13 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ProductType)}
          >
            <option value="todo">Tipo: Todos</option>
            <option value="maestro_frenos">Maestro frenos</option>
            <option value="maestro_clutch">Maestro clutch</option>
            <option value="auxiliar_frenos">Auxiliar frenos</option>
            <option value="auxiliar_clutch">Auxiliar clutch</option>
            <option value="pastillas_freno">Pastillas freno</option>
          </select>

          <select
            className="input"
            style={{ minWidth: 130, fontSize: 13 }}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProductStatus | "todos")
            }
          >
            <option value="todos">Estado: Todos</option>
            <option value="disponible">Disponible</option>
            <option value="bajo">Bajo stock</option>
            <option value="agotado">Agotado</option>
            <option value="reserva">Reserva (en camino)</option>
          </select>
        </div>
      </div>

      {/* Contenido */}
      <div className="admin-table-container">
        {loading && <p>Cargando productos…</p>}

        {error && !loading && (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Marca</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>ETA</th>
                <th>Imágenes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 16 }}>
                    No hay productos que coincidan con el filtro.
                  </td>
                </tr>
              )}

              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco",
                    }}
                  >
                    {p.sku}
                  </td>
                  <td>{p.brand}</td>
                  <td>{p.desc}</td>
                  <td>{labelTipo(p.type)}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: bgEstado(p.status),
                        color: colorEstado(p.status),
                      }}
                    >
                      {labelEstado(p.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>
                    {p.status === "reserva"
                      ? p.eta?.trim()
                        ? p.eta.trim()
                        : "ETA sin definir"
                      : p.eta?.trim() || "—"}
                  </td>
                  <td>
                    {p.imgs && p.imgs.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            position: "relative",
                            borderRadius: 8,
                            overflow: "hidden",
                            border: "1px solid #e5e7eb",
                            background: "#f9fafb",
                          }}
                        >
                          <Image
                            src={p.imgs[0]}
                            alt={p.desc || p.sku}
                            fill
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                        {p.imgs.length > 1 && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              whiteSpace: "nowrap",
                            }}
                          >
                            +{p.imgs.length - 1} foto(s)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        Sin imagen
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

/* ================== Helpers de presentación ================== */

function labelTipo(tipo: ProductType): string {
  switch (tipo) {
    case "maestro_frenos":
      return "Maestro frenos";
    case "maestro_clutch":
      return "Maestro clutch";
    case "auxiliar_frenos":
      return "Auxiliar frenos";
    case "auxiliar_clutch":
      return "Auxiliar clutch";
    case "pastillas_freno":
      return "Pastillas freno";
    default:
      return "N/D";
  }
}

function labelEstado(status: ProductStatus): string {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "bajo":
      return "Bajo stock";
    case "agotado":
      return "Agotado";
    case "reserva":
      return "Reserva (en camino)";
    default:
      return "N/D";
  }
}

function bgEstado(status: ProductStatus): string {
  switch (status) {
    case "disponible":
      return "rgba(34,197,94,0.12)";
    case "bajo":
      return "rgba(245,158,11,0.12)";
    case "agotado":
      return "rgba(239,68,68,0.12)";
    case "reserva":
      return "rgba(59,130,246,0.12)";
    default:
      return "#e5e7eb";
  }
}

function colorEstado(status: ProductStatus): string {
  switch (status) {
    case "disponible":
      return "#166534";
    case "bajo":
      return "#92400e";
    case "agotado":
      return "#b91c1c";
    case "reserva":
      return "#1d4ed8";
    default:
      return "#4b5563";
  }
}
