"use client";

import { useEffect, useState } from "react";
import "../admin.css";

type Sucursales = 1 | 2 | 3;

type Cliente = {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
  sucursales: Sucursales;
};

type FormState = {
  id: number | null;
  nombre: string;
  codigo: string;
  activo: boolean;
  sucursales: Sucursales;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    id: null,
    nombre: "",
    codigo: "",
    activo: true,
    sucursales: 1,
  });

  /* =============================
     Cargar clientes desde API
  ==============================*/
  async function loadClientes() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/clientes/list");
      if (!res.ok) throw new Error("Error listando clientes");

      const data = (await res.json()) as any[];

      const normalizados: Cliente[] = data.map((c) => {
        let suc: Sucursales = 1;
        if (c.sucursales === 2) suc = 2;
        if (c.sucursales === 3) suc = 3;

        return {
          id: Number(c.id),
          nombre: String(c.nombre ?? ""),
          codigo: String(c.codigo ?? ""),
          activo: Boolean(c.activo),
          sucursales: suc,
        };
      });

      setClientes(normalizados);
    } catch (err) {
      console.error("Error en loadClientes:", err);
      setError("No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClientes();
  }, []);

  /* =============================
     Handlers de formulario
  ==============================*/

  function handleEdit(c: Cliente) {
    setForm({
      id: c.id,
      nombre: c.nombre,
      codigo: c.codigo,
      activo: c.activo,
      sucursales: c.sucursales,
    });
  }

  function handleNew() {
    setForm({
      id: null,
      nombre: "",
      codigo: "",
      activo: true,
      sucursales: 1,
    });
  }

  function handleChange(
    field: keyof FormState,
    value: string | boolean | Sucursales
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/clientes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id ?? undefined,
          nombre: form.nombre,
          codigo: form.codigo,
          activo: form.activo,
          sucursales: form.sucursales,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Error guardando cliente.");
        return;
      }

      await loadClientes();
      handleNew();
    } catch (err) {
      console.error("Error en handleSave:", err);
      setError("Error guardando cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar este cliente?")) return;

    try {
      setError(null);
      const res = await fetch("/api/clientes/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Error eliminando cliente.");
        return;
      }

      await loadClientes();
    } catch (err) {
      console.error("Error en handleDelete:", err);
      setError("Error eliminando cliente.");
    }
  }

  /* =============================
     Render
  ==============================*/

  return (
    <div className="admin-panel">
      <h1 className="admin-title">Clientes</h1>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 6,
            background: "rgba(239,68,68,0.1)",
            color: "#b91c1c",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSave}
        style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: 12,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr auto",
          gap: 12,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 4,
              color: "#374151",
            }}
          >
            Nombre
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 4,
              color: "#374151",
            }}
          >
            Código (usuario)
          </label>
          <input
            type="text"
            value={form.codigo}
            onChange={(e) => handleChange("codigo", e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
            required
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#374151",
              }}
            >
              Sucursales:
              <select
                value={form.sucursales}
                onChange={(e) =>
                  handleChange(
                    "sucursales",
                    Number(e.target.value) as Sucursales
                  )
                }
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#374151",
              }}
            >
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) =>
                  handleChange("activo", e.target.checked)
                }
              />
              Activo
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleNew}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                background: "#ffffff",
              }}
            >
              Nuevo
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 14,
                background: "#ea9216",
                color: "#ffffff",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {form.id ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </div>
      </form>

      {/* Tabla de clientes */}
      <div className="admin-table-container">
        {loading ? (
          <p style={{ padding: 20 }}>Cargando...</p>
        ) : clientes.length === 0 ? (
          <p style={{ padding: 20 }}>No hay clientes aún.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Código</th>
                <th>Sucursales</th>
                <th>Estado</th>
                <th style={{ width: 160 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.codigo}</td>
                  <td>{c.sucursales}</td>
                  <td>{c.activo ? "Activo" : "Inactivo"}</td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-start",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEdit(c)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          fontSize: 13,
                          background: "#ffffff",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 13,
                          background: "rgba(239,68,68,0.12)",
                          color: "#b91c1c",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
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
