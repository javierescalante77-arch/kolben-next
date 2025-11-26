// app/admin/catalogo/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import "../admin.css";
import "../productos/productos.css";

/**
 * Tipos de producto y estados exactamente como los que devuelve
 * /api/productos/list
 */
type ProductStatus = "disponible" | "bajo" | "agotado" | "reserva";

type TipoProducto =
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
  type: TipoProducto;
  imgs: string[];
};

type ApiResponse = {
  ok: boolean;
  data?: Product[];
  error?: string;
};

export default function CatalogoAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/productos/list");
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const json = (await res.json()) as ApiResponse;

        if (!json.ok) {
          throw new Error(json.error || "Error cargando productos");
        }

        if (!cancelled && json.data) {
          setProducts(json.data);
        }
      } catch (err: any) {
        console.error("Error cargando catálogo admin:", err);
        if (!cancelled) {
          setError(err?.message ?? "Error cargando productos");
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

  return (
    <main className="container">
      <h1 style={{ marginBottom: 16 }}>Catálogo (admin)</h1>

      {loading && <p>Cargando productos…</p>}

      {error && !loading && (
        <div
          style={{
            marginTop: 12,
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
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>
                    No hay productos aún.
                  </td>
                </tr>
              )}

              {products.map((p) => (
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
                  <td>{labelEstado(p.status, p.eta)}</td>
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
                            width: 64,
                            height: 64,
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
        </div>
      )}
    </main>
  );
}

function labelTipo(tipo: TipoProducto): string {
  switch (tipo) {
    case "maestro_frenos":
      return "Maestro de frenos";
    case "maestro_clutch":
      return "Maestro de clutch";
    case "auxiliar_frenos":
      return "Auxiliar de frenos";
    case "auxiliar_clutch":
      return "Auxiliar de clutch";
    case "pastillas_freno":
      return "Pastillas de freno";
    default:
      return "N/D";
  }
}

function labelEstado(status: ProductStatus, eta?: string): string {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "bajo":
      return "Bajo stock";
    case "agotado":
      return "Agotado";
    case "reserva":
      return eta && eta.trim()
        ? `En camino · ${eta.trim()}`
        : "En camino";
    default:
      return "N/D";
  }
}
