"use client";

import "./productos.css";
import { useEffect, useState } from "react";

type ProductStatus = "disponible" | "bajo" | "agotado" | "reserva";

type Product = {
  id: string;
  sku: string;
  brand: string;
  desc: string;
  status: ProductStatus;
  type: string;
  imgs: string[];
};

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/productos/list");
        const json = await res.json();

        console.log("JSON desde /api/productos/list:", json);

        // Soporta dos formatos: array directo o { ok, data }
        const data: Product[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];

        console.log("Productos normalizados:", data);
        (window as any).__productos = data; // para inspeccionar en consola

        setProducts(data);
      } catch (err: any) {
        console.error("Error cargando productos (admin):", err);
        setError(err?.message ?? "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="panel">
      <h1 style={{ marginBottom: 16 }}>Productos</h1>

      {loading && <p>Cargando productos.</p>}

      {error && !loading && (
        <p style={{ color: "red", marginBottom: 16 }}>
          Error al cargar productos: {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p style={{ opacity: 0.7 }}>Todavía no hay productos en la base.</p>
      )}

      {!loading && !error && products.length > 0 && (
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
              {products.map((p) => {
                const allImgs = Array.isArray(p.imgs)
                  ? p.imgs.filter(
                      (url) => typeof url === "string" && url.trim() !== ""
                    )
                  : [];

                const visibleImgs = allImgs.slice(0, 3);
                const extraCount = allImgs.length - visibleImgs.length;

                return (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.sku}</td>
                    <td>{p.brand}</td>
                    <td>{p.desc}</td>
                    <td>{p.type}</td>
                    <td>{p.status}</td>
                    <td className="imagenes-cell">
                      {allImgs.length === 0 ? (
                        "—"
                      ) : (
                        <div className="imagenes-thumbs">
                          {visibleImgs.map((url, idx) => (
                            <div className="thumb-wrap" key={idx}>
                              {url ? (
                                <img
                                  src={url}
                                  alt={`Producto ${p.sku} (${idx + 1})`}
                                  className="thumb"
                                />
                              ) : (
                                <span className="thumb-placeholder">IMG</span>
                              )}
                            </div>
                          ))}

                          {extraCount > 0 && (
                            <span className="thumb-more">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
