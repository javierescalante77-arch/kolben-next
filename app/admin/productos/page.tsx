"use client";

import { useEffect, useState } from "react";
import "./productos.css";
import "../admin.css";

type Producto = {
  id: number;
  sku: string;
  brand: string;
  desc: string;
  category: string;
  status: string;
  imgs: string[];
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  /* =============================
     Cargar productos desde API
  ==============================*/
  async function loadProductos() {
    try {
      const res = await fetch("/api/productos/list");
      if (!res.ok) throw new Error("Error cargando productos");
      const data = await res.json();

      // Normalizamos imágenes: garantizar []
      const normalized = data.map((p: Producto) => ({
        ...p,
        imgs: Array.isArray(p.imgs) ? p.imgs : [],
      }));

      setProductos(normalized);
    } catch (err) {
      console.error("Error en loadProductos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProductos();
  }, []);

  return (
    <div className="admin-panel">
      <h1 className="admin-title">Productos</h1>

      <div className="admin-table-container">
        {loading ? (
          <p style={{ padding: 20 }}>Cargando...</p>
        ) : productos.length === 0 ? (
          <p style={{ padding: 20 }}>No hay productos aún.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Marca</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Imágenes</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.sku}</td>
                  <td>{p.brand}</td>
                  <td>{p.desc}</td>
                  <td>{p.category}</td>
                  <td>{p.status}</td>

                  {/* ========================
                      Miniaturas desde CSS
                  ========================= */}
                  <td className="imagenes-cell">
                    {p.imgs.length === 0 ? (
                      <span className="thumb-more">Sin imágenes</span>
                    ) : (
                      <div className="imagenes-thumbs">
                        {p.imgs.slice(0, 3).map((img, idx) => (
                          <div key={idx} className="thumb-wrap">
                            <img src={img} className="thumb" />
                          </div>
                        ))}

                        {p.imgs.length > 3 && (
                          <span className="thumb-more">
                            +{p.imgs.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
