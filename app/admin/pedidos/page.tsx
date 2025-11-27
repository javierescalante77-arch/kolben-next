"use client";

import { useEffect, useState } from "react";
import "../admin.css";

type Estado = "PENDIENTE" | "PREPARANDO" | "ENVIADO";

type PedidoItem = {
  sku: string;
  cantidadA: number;
  cantidadB: number;
  cantidadC: number;
  tipo: "NORMAL" | "RESERVA";
  estadoTexto: string | null;
  etaTexto: string | null;
};

type Pedido = {
  id: number;
  createdAt: string;
  estado: Estado;
  dispositivo?: string | null;
  cliente: {
    id: number;
    nombre: string;
    codigo: string;
    sucursales: number;
  };
  items: PedidoItem[];
};

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  /* ===========================
     Cargar pedidos
  ==============================*/
  const loadPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/pedidos/list");
      const json = await res.json();

      if (!res.ok || !json.ok) throw new Error(json.error);

      setPedidos((json.data || []) as Pedido[]);
    } catch (err: any) {
      console.error("Error cargando pedidos:", err);
      setError(err.message || "Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  /* ===========================
     Eliminar pedido
  ==============================*/
  const eliminarPedido = async (id: number) => {
    const confirmDelete = window.confirm(
      `¿Eliminar pedido #${id} definitivamente?`
    );
    if (!confirmDelete) return;

    try {
      setDeleting(id);

      const res = await fetch(`/api/pedidos/delete?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo eliminar");
      }

      await loadPedidos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const estadoLabel = (e: Estado) => {
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
  };

  return (
    <div className="admin-container">
      <h1 className="page-title">Pedidos</h1>

      {loading && <p>Cargando pedidos…</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {!loading && pedidos.length === 0 && <p>No hay pedidos aún.</p>}

      <div className="orders-list">
        {pedidos.map((p) => {
          const piezas = p.items?.reduce(
            (acc, it) =>
              acc +
              (it.cantidadA ?? 0) +
              (it.cantidadB ?? 0) +
              (it.cantidadC ?? 0),
            0
          );

          const dispositivoLabel = p.dispositivo?.trim()
            ? p.dispositivo
            : "No registrado";

          return (
            <div key={p.id} className="order-card">
              <div className="order-header">
                <div>
                  <strong>Pedido #{p.id}</strong>
                  <div className="order-subtext">
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className={`order-status status-${p.estado.toLowerCase()}`}>
                  {estadoLabel(p.estado)}
                </div>
              </div>

              <div className="order-body">
                <div className="order-row">
                  Cliente: <strong>{p.cliente.nombre}</strong> ({p.cliente.codigo})
                </div>

                <div className="order-row">
                  Piezas totales: <strong>{piezas}</strong>
                </div>

                <div className="order-row">
                  Dispositivo: <strong>{dispositivoLabel}</strong>
                </div>
              </div>

              {p.estado === "ENVIADO" && (
                <button
                  className="btn-delete"
                  onClick={() => eliminarPedido(p.id)}
                  disabled={deleting === p.id}
                >
                  {deleting === p.id ? "Eliminando…" : "Quitar"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
