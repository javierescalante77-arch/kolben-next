"use client";

import { useState } from "react";
import Link from "next/link";
import "../../cliente/cliente.css";

/* =========================
   Tipos y datos de demo
   ========================= */

type EstadoPill = "Disponible" | "Bajo stock" | "Agotado" | "Llegando";

type TipoItem = "reserva" | "normal";

type CartRow = {
  id: number; // línea (1, 2, 3…)
  codigo: string;
  descripcion: string;
  estado: EstadoPill;
  eta: string; // "-" o fecha (ej: "25 Enero")
  tipo: TipoItem;
  sucursalA: number;
  sucursalB: number;
  sucursalC: number;
};

// Por ahora: datos de ejemplo (no vienen de BD).
// Más adelante se conectará al carrito / pedidos reales.
const initialRows: CartRow[] = [
  {
    id: 1,
    codigo: "47201-60460",
    descripcion: "Cilindro maestro Corolla 3 tornillos 13/16",
    estado: "Llegando",
    eta: "25 Enero", // ejemplo para ver "Llegando · 25 Enero"
    tipo: "reserva",
    sucursalA: 1,
    sucursalB: 1,
    sucursalC: 1,
  },
  {
    id: 2,
    codigo: "47210-AD200",
    descripcion: "Cilindro maestro Tiida 95-05",
    estado: "Bajo stock",
    eta: "-",
    tipo: "normal",
    sucursalA: 1,
    sucursalB: 1,
    sucursalC: 1,
  },
];

/* =========================
   Helpers visuales
   ========================= */

function pillForEstado(estado: EstadoPill, eta?: string) {
  // Determinar clase base por tipo de estado
  let className = "pill ok";

  if (estado === "Agotado") className = "pill bad";
  else if (estado === "Bajo stock") className = "pill low";
  else if (estado === "Llegando") className = "pill res";

  // Texto de la chip
  let label: string = estado;


  // Reglas:
  // - En catálogo: se usará simplemente "Llegando"
  // - En carrito: queremos "Llegando · {ETA}" si hay fecha válida
  if (estado === "Llegando" && eta && eta.trim() !== "-" && eta.trim() !== "") {
    label = `Llegando · ${eta}`;
  }

  return <span className={className}>{label}</span>;
}

/* =========================
   Página Carrito (admin)
   ========================= */

export default function AdminCarritoPage() {
  const [rows, setRows] = useState<CartRow[]>(initialRows);

  const handleQtyChange = (
    id: number,
    field: "sucursalA" | "sucursalB" | "sucursalC",
    value: number
  ) => {
    const safe = Number.isNaN(value) ? 0 : Math.max(0, value);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: safe } : r))
    );
  };

  const handleRemove = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Carrito</h1>

      <div className="panel">
        {/* Banda superior: mensaje de carrito */}
        <div
          style={{
            padding: "12px 24px",
            marginBottom: 20,
            borderRadius: 14,
            background: "#EBF5FF",
            fontSize: 14,
          }}
        >
          Agrega tus productos con calma, tu carrito los guardará
          automáticamente.
        </div>

        {/* ====== VISTA ESCRITORIO: TABLA ====== */}
        <div className="table-wrap desktop-only">
          <table className="table">
            <thead>
              <tr>
                <th rowSpan={2}>#</th>
                <th rowSpan={2}>Código</th>
                <th rowSpan={2}>Descripción</th>
                <th rowSpan={2}>Estado</th>
                <th rowSpan={2}>ETA</th>
                <th rowSpan={2}>Tipo</th>
                <th colSpan={3}>Sucursales</th>
                <th rowSpan={2}>Acción</th>
              </tr>
              <tr>
                <th>Cantidad sucursal A</th>
                <th>Cantidad sucursal B</th>
                <th>Cantidad sucursal C</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{row.codigo}</td>
                  <td>{row.descripcion}</td>
                  <td>{pillForEstado(row.estado, row.eta)}</td>
                  <td>{row.eta}</td>
                  <td>{row.tipo}</td>

                  <td>
                    <input
                      type="number"
                      min={0}
                      value={row.sucursalA}
                      onChange={(e) =>
                        handleQtyChange(
                          row.id,
                          "sucursalA",
                          Number(e.target.value)
                        )
                      }
                      className="qty-input"
                      style={{ width: 60 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={row.sucursalB}
                      onChange={(e) =>
                        handleQtyChange(
                          row.id,
                          "sucursalB",
                          Number(e.target.value)
                        )
                      }
                      className="qty-input"
                      style={{ width: 60 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={row.sucursalC}
                      onChange={(e) =>
                        handleQtyChange(
                          row.id,
                          "sucursalC",
                          Number(e.target.value)
                        )
                      }
                      className="qty-input"
                      style={{ width: 60 }}
                    />
                  </td>

                  <td>
                    <button
                      className="btn danger"
                      onClick={() => handleRemove(row.id)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24 }}>
                    Tu carrito está vacío.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ====== VISTA MÓVIL: CÁPSULAS ====== */}
        <div className="cart-cards mobile-only">
          {rows.map((row) => (
            <article key={row.id} className="cart-card">
              <header className="cart-card-head">
                <div className="cart-card-code">{row.codigo}</div>
                <div className="cart-card-estado">
                  {pillForEstado(row.estado, row.eta)}
                </div>
              </header>

              <div className="cart-card-desc">{row.descripcion}</div>

              {/* Ya NO mostramos ETA aparte, porque va dentro de la pill:
                  "Llegando · {ETA}" */}
              {/* {row.tipo === "reserva" && row.eta !== "-" && (
                <div className="cart-card-meta">
                  <span className="eta-label">ETA:</span>
                  <span className="eta-value">{row.eta}</span>
                </div>
              )} */}

              <div className="cart-card-qty-row">
                <span className="qty-label">Cantidad sucursal A</span>
                <input
                  type="number"
                  min={0}
                  value={row.sucursalA}
                  onChange={(e) =>
                    handleQtyChange(row.id, "sucursalA", Number(e.target.value))
                  }
                  className="qty-input"
                />
              </div>

              <div className="cart-card-qty-row">
                <span className="qty-label">Cantidad sucursal B</span>
                <input
                  type="number"
                  min={0}
                  value={row.sucursalB}
                  onChange={(e) =>
                    handleQtyChange(row.id, "sucursalB", Number(e.target.value))
                  }
                  className="qty-input"
                />
              </div>

              <div className="cart-card-qty-row">
                <span className="qty-label">Cantidad sucursal C</span>
                <input
                  type="number"
                  min={0}
                  value={row.sucursalC}
                  onChange={(e) =>
                    handleQtyChange(row.id, "sucursalC", Number(e.target.value))
                  }
                  className="qty-input"
                />
              </div>

              <div className="cart-card-actions">
                <button
                  className="btn danger"
                  onClick={() => handleRemove(row.id)}
                >
                  Quitar
                </button>
              </div>
            </article>
          ))}

          {rows.length === 0 && (
            <div className="cart-card-empty">
              Tu carrito está vacío.
            </div>
          )}
        </div>

        {/* Botones inferiores (comunes a ambas vistas) */}
        <div
          className="row"
          style={{ marginTop: 20, justifyContent: "space-between" }}
        >
          <Link href="/admin/catalogo" className="btn-ghost">
            Catálogo
          </Link>

          <button className="btn primary">Enviar orden</button>
        </div>
      </div>
    </div>
  );
}

