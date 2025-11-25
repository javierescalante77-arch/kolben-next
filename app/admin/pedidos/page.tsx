"use client";

import { useState } from "react";
import "../../cliente/cliente.css";

/**
 * Estados posibles del pedido
 */
type OrderStatus = "Pendiente" | "Preparando" | "Enviado";

/**
 * Tipo de ítem dentro de un pedido
 */
type OrderItem = {
  sku: string;
  desc: string;
  qtyA: number;
  qtyB: number;
  qtyC: number;
};

/**
 * Tipo de pedido para la vista admin
 */
type Order = {
  id: string; // ejemplo: "ORD-001"
  cliente: string;
  createdAt: string; // texto ya formateado: "21/11/2025, 10:29:42 AM"
  device: "PC" | "Móvil" | "Tablet";
  itemsCount: number;
  sucursalesActivas: number; // 1, 2 o 3
  estado: OrderStatus;
  items: OrderItem[];
};

/**
 * Datos demo en memoria (hasta conectar Prisma / DB real)
 */
const sampleOrders: Order[] = [
  {
    id: "ORD-001",
    cliente: "Repuestos Don Julio",
    createdAt: "21/11/2025, 10:29:42 AM",
    device: "PC",
    itemsCount: 7,
    sucursalesActivas: 3,
    estado: "Pendiente",
    items: [
      {
        sku: "KB-001",
        desc: "Cilindro maestro frenos delantero · sedán compacto",
        qtyA: 2,
        qtyB: 1,
        qtyC: 0,
      },
      {
        sku: "KB-003",
        desc: "Auxiliar de frenos trasero · uso severo",
        qtyA: 3,
        qtyB: 0,
        qtyC: 1,
      },
    ],
  },
  {
    id: "ORD-002",
    cliente: "AutoCentro Eléctrico",
    createdAt: "20/11/2025, 10:14:42 PM",
    device: "PC",
    itemsCount: 6,
    sucursalesActivas: 2,
    estado: "Preparando",
    items: [
      {
        sku: "KB-004",
        desc: "Pastillas frenos cerámicas · mayor vida útil",
        qtyA: 4,
        qtyB: 2,
        qtyC: 0,
      },
    ],
  },
];

/**
 * Página de pedidos (admin) con layout EONIK + "Ver detalle"
 */
export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  // control local: qué pedidos tienen el detalle abierto
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  const toggleDetails = (id: string) => {
    setOpenDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateOrderStatus = (id: string, next: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, estado: next } : o))
    );
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ marginBottom: 20 }}>Pedidos</h1>

      {orders.length === 0 && (
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
                  alignItems: "flex-start",
                  marginBottom: 16,
                  gap: 16,
                }}
              >
                {/* Lado izquierdo: fecha/hora + título + solicitante + ítems */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                      fontSize: 13,
                      color: "#4b5563",
                    }}
                  >
                    <span
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
                      fontSize: 14,
                      color: "#4b5563",
                    }}
                  >
                    Ítems{" "}
                    <span style={{ fontWeight: 600 }}>{order.itemsCount}</span>
                  </div>
                </div>

                {/* Lado derecho: selector de status */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
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
                  marginBottom: 16,
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  className="btn light"
                  style={{
                    padding: "8px 20px",
                    borderRadius: 999,
                    fontSize: 14,
                  }}
                >
                  PDF
                </button>

                {/* Solo visible mientras el pedido esté Pendiente */}
                {order.estado === "Pendiente" && (
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{
                      padding: "8px 18px",
                      borderRadius: 999,
                      fontSize: 14,
                    }}
                  >
                    Editar
                  </button>
                )}

                <button
                  type="button"
                  className="btn primary"
                  style={{
                    padding: "8px 20px",
                    borderRadius: 999,
                    fontSize: 14,
                  }}
                  onClick={() => toggleDetails(order.id)}
                >
                  {detalleAbierto ? "Ocultar detalle" : "Ver detalle"}
                </button>
              </div>

              {/* ==== DETALLE TABLA (SKU / DESC / A B C) ==== */}
              {detalleAbierto && (
                <div className="table-wrap" style={{ marginBottom: 12 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Descripción</th>
                        {order.sucursalesActivas >= 1 && <th>A</th>}
                        {order.sucursalesActivas >= 2 && <th>B</th>}
                        {order.sucursalesActivas >= 3 && <th>C</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.sku}</td>
                          <td>{it.desc}</td>
                          {order.sucursalesActivas >= 1 && <td>{it.qtyA}</td>}
                          {order.sucursalesActivas >= 2 && <td>{it.qtyB}</td>}
                          {order.sucursalesActivas >= 3 && <td>{it.qtyC}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ==== NOTA FINAL ==== */}
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                Clientes no pueden editar tras <strong>Preparando</strong> /
                <strong> Enviado</strong>.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
