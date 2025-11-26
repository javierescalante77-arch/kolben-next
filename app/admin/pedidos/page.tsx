"use client";

import { useEffect, useState, Fragment } from "react";
import "../../cliente/cliente.css";


/* ================== Tipos de la UI ================== */

type OrderStatus = "Pendiente" | "Preparando" | "Enviado";

type OrderItem = {
  sku: string;
  desc: string;
  qtyA: number;
  qtyB: number;
  qtyC: number;
  tipo: "NORMAL" | "RESERVA";
  estadoTexto?: string | null;
  etaTexto?: string | null;
};

type Order = {
  id: string;
  cliente: string;
  createdAt: string;
  device: "PC" | "Móvil" | "Tablet";
  itemsCount: number;
  sucursalesActivas: number;
  estado: OrderStatus;
  items: OrderItem[];
};

/* ============ Tipos aproximados de la respuesta API ============ */

type PedidoItemApi = {
  id: number;
  cantidadA: number;
  cantidadB: number;
  cantidadC: number;
  tipo: "NORMAL" | "RESERVA";
  estadoTexto: string | null;
  etaTexto: string | null;
  producto?: {
    sku: string;
    marca: string;
    descripcion: string;
  } | null;
};

type PedidoApi = {
  id: number;
  createdAt: string;
  estado: "PENDIENTE" | "PREPARANDO" | "ENVIADO";
  comentario: string | null;
  dispositivoOrigen: string | null;
  cliente?: {
    id: number;
    nombre: string;
    codigo: string;
    sucursales: number;
  } | null;
  items: PedidoItemApi[];
};

/* ================== Helpers de mapeo ================== */

function mapDbEstadoToUi(e: PedidoApi["estado"]): OrderStatus {
  switch (e) {
    case "PREPARANDO":
      return "Preparando";
    case "ENVIADO":
      return "Enviado";
    default:
      return "Pendiente";
  }
}

function mapUiEstadoToDb(e: OrderStatus): PedidoApi["estado"] {
  switch (e) {
    case "Preparando":
      return "PREPARANDO";
    case "Enviado":
      return "ENVIADO";
    default:
      return "PENDIENTE";
  }
}

function mapDevice(dispositivoOrigen: string | null): Order["device"] {
  if (!dispositivoOrigen) return "PC";
  const d = dispositivoOrigen.toLowerCase();

  if (d.includes("movil") || d.includes("móvil") || d.includes("iphone") || d.includes("android")) {
    return "Móvil";
  }
  if (d.includes("tablet") || d.includes("ipad")) {
    return "Tablet";
  }
  return "PC";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-HN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function mapPedidosApiToOrders(apiPedidos: PedidoApi[]): Order[] {
  return apiPedidos.map((p) => {
    const sucursales = p.cliente?.sucursales ?? 1;

    const items: OrderItem[] = p.items.map((it) => ({
      sku: it.producto?.sku ?? "SIN-SKU",
      desc: it.producto?.descripcion ?? it.estadoTexto ?? "Producto",
      qtyA: it.cantidadA ?? 0,
      qtyB: it.cantidadB ?? 0,
      qtyC: it.cantidadC ?? 0,
      tipo: it.tipo ?? "NORMAL",
      estadoTexto: it.estadoTexto,
      etaTexto: it.etaTexto,
    }));

    const itemsCount = items.reduce(
      (acc, it) => acc + it.qtyA + it.qtyB + it.qtyC,
      0
    );

    return {
      id: String(p.id),
      cliente: p.cliente?.nombre ?? "Cliente sin nombre",
      createdAt: formatDate(p.createdAt),
      device: mapDevice(p.dispositivoOrigen),
      itemsCount,
      sucursalesActivas: sucursales,
      estado: mapDbEstadoToUi(p.estado),
      items,
    };
  });
}

/* ================== Página Admin / Pedidos ================== */

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar pedidos reales desde Neon
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/pedidos/list", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!json.ok || !Array.isArray(json.data)) {
          console.error("Respuesta inesperada de /api/pedidos/list:", json);
          setError("Error al cargar pedidos.");
          setOrders([]);
          return;
        }

        const mapped = mapPedidosApiToOrders(json.data as PedidoApi[]);
        setOrders(mapped);
      } catch (e: any) {
        console.error("Error cargando pedidos:", e);
        setError("No se pudieron cargar los pedidos.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleDetails = (id: string) => {
    setOpenDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateOrderStatus = async (id: string, next: OrderStatus) => {
    // Optimista en la UI
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { o, ...o, estado: next } : o))
    );

    try {
      const res = await fetch("/api/pedidos/updateEstado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId: Number(id),
          estado: mapUiEstadoToDb(next),
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        console.error("Error desde API updateEstado:", json);
      }
    } catch (e) {
      console.error("Error llamando a /api/pedidos/updateEstado:", e);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ marginBottom: 20 }}>Pedidos</h1>

      {loading && (
        <div className="panel" style={{ padding: 24, textAlign: "center" }}>
          Cargando pedidos…
        </div>
      )}

      {!loading && error && (
        <div
          className="panel"
          style={{
            padding: 24,
            marginBottom: 16,
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {!loading && orders.length === 0 && !error && (
        <div className="panel" style={{ padding: 24, textAlign: "center" }}>
          No hay pedidos aún.
        </div>
      )}

      {/* GRID de tarjetas – 2 columnas en desktop, 1 en móvil */}
      <div className="orders-grid">
        {orders.map((order) => {
          const detalleAbierto = !!openDetails[order.id];

          return (
            <div
              key={order.id}
              className="panel"
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* ==== CABECERA SUPERIOR ==== */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 12,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Pedido
                    </span>

                    <span
                      className="badge subtle"
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        backgroundColor: "#f3f4ff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {order.createdAt}
                    </span>

                    <span
                      className="badge subtle"
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        fontWeight: 500,
                      }}
                    >
                      {order.device}
                    </span>
                  </div>

                  <h2 style={{ margin: 0, marginBottom: 4 }}>{order.id}</h2>

                  <div
                    style={{
                      fontSize: 14,
                      color: "#4b5563",
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>Solicitante</span>{" "}
                    {order.cliente}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    {order.itemsCount} ítems · {order.sucursalesActivas}{" "}
                    sucursal(es) activas
                  </div>
                </div>

                {/* columna derecha: estado */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                    minWidth: 160,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      marginBottom: 2,
                    }}
                  >
                    Status
                  </span>
                  <select
                    value={order.estado}
                    onChange={(e) =>
                      updateOrderStatus(order.id, e.target.value as OrderStatus)
                    }
                    className="input"
                    style={{
                      padding: "6px 12px",
                      minWidth: 140,
                      fontSize: 14,
                    }}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Preparando">Preparando</option>
                    <option value="Enviado">Enviado</option>
                  </select>
                </div>
              </div>

              {/* ==== BOTONES PDF / EDITAR / VER DETALLE ==== */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: detalleAbierto ? 12 : 0,
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn secondary"
                    style={{ padding: "6px 14px", fontSize: 13 }}
                  >
                    PDF pedido
                  </button>

                  <button
                    type="button"
                    className="btn ghost"
                    style={{ padding: "6px 14px", fontSize: 13 }}
                    onClick={() => toggleDetails(order.id)}
                  >
                    {detalleAbierto ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    textAlign: "right",
                  }}
                >
                  Actualizar estado aquí se replica en Neon.
                </div>
              </div>

              {/* ==== DETALLE DE ÍTEMS ==== */}
              {detalleAbierto && (
                <div
                  style={{
                    marginTop: 8,
                    borderTop: "1px dashed #e5e7eb",
                    paddingTop: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Detalle de ítems
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      columnGap: 8,
                      rowGap: 4,
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 500,
                        color: "#4b5563",
                      }}
                    >
                      SKU · Descripción
                    </div>
                    <div style={{ fontWeight: 500, textAlign: "center" }}>
                      A
                    </div>
                    <div style={{ fontWeight: 500, textAlign: "center" }}>
                      B
                    </div>
                    <div style={{ fontWeight: 500, textAlign: "center" }}>
                      C
                    </div>

                    {order.items.map((item, idx) => (
                      <Fragment key={`${order.id}-${idx}`}>
                        <div
                          style={{
                            padding: "4px 0",
                            borderTop: "1px dashed #f3f4f6",
                          }}
                        >
                          <div>{item.sku}</div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            {item.desc}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "4px 0",
                            borderTop: "1px dashed #f3f4f6",
                            textAlign: "center",
                          }}
                        >
                          {item.qtyA}
                        </div>
                        <div
                          style={{
                            padding: "4px 0",
                            borderTop: "1px dashed #f3f4f6",
                            textAlign: "center",
                          }}
                        >
                          {item.qtyB}
                        </div>
                        <div
                          style={{
                            padding: "4px 0",
                            borderTop: "1px dashed #f3f4f6",
                            textAlign: "center",
                          }}
                        >
                          {item.qtyC}
                        </div>
                      </Fragment>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Clientes no pueden editar tras <strong>Preparando</strong> /{" "}
                    <strong>Enviado</strong>.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
