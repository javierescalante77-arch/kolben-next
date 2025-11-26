"use client";

import { useEffect, useState } from "react";
import "../admin.css";

type EstadoPedido = "PENDIENTE" | "PREPARANDO" | "ENVIADO";

type ClienteApi = {
  id: number;
  nombre: string;
  codigo: string;
  sucursales: number;
};

type ProductoApi = {
  id: number;
  sku: string;
  marca: string;
  descripcion: string;
};

type PedidoItemApi = {
  id: number;
  cantidadA: number;
  cantidadB: number;
  cantidadC: number;
  estadoTexto: string | null;
  etaTexto: string | null;
  tipo: "NORMAL" | "RESERVA";
  producto: ProductoApi | null;
};

type PedidoApi = {
  id: number;
  createdAt: string;
  estado: EstadoPedido;
  comentario: string | null;
  dispositivoOrigen: string | null;
  cliente: ClienteApi | null;
  items: PedidoItemApi[];
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-HN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function estadoLabel(e: EstadoPedido): string {
  switch (e) {
    case "PENDIENTE":
      return "Pendiente";
    case "PREPARANDO":
      return "Preparando";
    case "ENVIADO":
      return "Enviado";
    default:
      return e;
  }
}

function nextEstado(e: EstadoPedido): EstadoPedido | null {
  if (e === "PENDIENTE") return "PREPARANDO";
  if (e === "PREPARANDO") return "ENVIADO";
  return null;
}

function computeTotales(p: PedidoApi) {
  let totalA = 0;
  let totalB = 0;
  let totalC = 0;
  for (const item of p.items) {
    totalA += item.cantidadA ?? 0;
    totalB += item.cantidadB ?? 0;
    totalC += item.cantidadC ?? 0;
  }
  const total = totalA + totalB + totalC;
  return { totalA, totalB, totalC, total };
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/pedidos/list");
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Error al listar pedidos");
      }

      const data = (json.data || []) as PedidoApi[];
      setPedidos(data);
    } catch (err: any) {
      console.error("Error cargando pedidos admin:", err);
      setErrorMsg(err.message || "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  const handleCambiarEstado = async (pedido: PedidoApi) => {
    const siguiente = nextEstado(pedido.estado);
    if (!siguiente) return;

    try {
      setUpdatingId(pedido.id);

      const res = await fetch("/api/pedidos/updateEstado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId: pedido.id,
          estado: siguiente,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Error al actualizar estado");
      }

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedido.id ? { ...p, estado: siguiente } : p))
      );
    } catch (err: any) {
      console.error("Error cambiando estado:", err);
      setErrorMsg(err.message || "Error al cambiar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="panel">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div>
          <h1>Pedidos</h1>
          <p style={{ marginTop: 4, color: "#6b7280", fontSize: "0.9rem" }}>
            Lista de pedidos enviados desde el catálogo Kolben.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPedidos}
          className="btn-ghost"
          style={{ whiteSpace: "nowrap" }}
        >
          Recargar
        </button>
      </div>

      {loading && (
        <p style={{ marginTop: 12, fontSize: "0.9rem" }}>Cargando pedidos…</p>
      )}

      {errorMsg && (
        <p style={{ marginTop: 8, color: "#b91c1c", fontSize: "0.9rem" }}>
          {errorMsg}
        </p>
      )}

      {pedidos.length === 0 && !loading && !errorMsg && (
        <p style={{ marginTop: 12, fontSize: "0.9rem" }}>
          Aún no hay pedidos registrados.
        </p>
      )}

      {pedidos.length > 0 && (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Suc.</th>
                <th>Piezas (A/B/C)</th>
                <th>Dispositivo</th>
                <th>Detalle</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const tot = computeTotales(p);
                const suc = p.cliente?.sucursales ?? 1;
                const isFinal = p.estado === "ENVIADO";
                const next = nextEstado(p.estado);

                return (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td>
                      {p.cliente?.nombre ?? "—"}
                      <br />
                      <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        {p.cliente?.codigo ?? ""}
                      </span>
                    </td>
                    <td>{estadoLabel(p.estado)}</td>
                    <td>{suc}</td>
                    <td>
                      {tot.total} total
                      <br />
                      <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        A: {tot.totalA} · B: {tot.totalB} · C: {tot.totalC}
                      </span>
                    </td>
                    <td>{p.dispositivoOrigen ?? "—"}</td>
                    <td>
                      <details>
                        <summary style={{ cursor: "pointer" }}>
                          Ver ({p.items.length})
                        </summary>
                        <div
                          style={{
                            marginTop: 4,
                            maxHeight: 180,
                            overflowY: "auto",
                          }}
                        >
                          {p.items.map((it) => (
                            <div
                              key={it.id}
                              style={{
                                fontSize: "0.8rem",
                                padding: "2px 0",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                            >
                              <strong>{it.producto?.sku ?? "—"}</strong>{" "}
                              {it.producto?.descripcion ?? ""}
                              <br />
                              <span style={{ color: "#6b7280" }}>
                                A: {it.cantidadA} · B: {it.cantidadB} · C:{" "}
                                {it.cantidadC}
                              </span>
                              {it.tipo === "RESERVA" && (
                                <span
                                  style={{
                                    marginLeft: 4,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  (Reserva {it.etaTexto ?? ""})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                    <td>
                      {isFinal || !next ? (
                        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          Sin cambios
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(p)}
                          disabled={updatingId === p.id}
                          className="btn-ghost"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {updatingId === p.id
                            ? "Actualizando..."
                            : `Marcar ${estadoLabel(next)}`}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
