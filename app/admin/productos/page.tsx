"use client";

import React, { useEffect, useMemo, useState } from "react";
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

  // ====== Estado del modal / formulario ======
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [formId, setFormId] = useState<string | null>(null);
  const [formSku, setFormSku] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<ProductType>("maestro_frenos");
  const [formStatus, setFormStatus] = useState<ProductStatus>("disponible");
  const [formEta, setFormEta] = useState("");
  const [formImgsText, setFormImgsText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // ====== Cargar productos desde la API ======
  const reloadProducts = async () => {
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

      setProducts(json.data);
    } catch (e: any) {
      console.error("Error cargando productos en admin:", e);
      setError(e?.message ?? "Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadProducts();
  }, []);

  // ====== Filtros en memoria ======
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
  const totalDisponible = products.filter((p) => p.status === "disponible")
    .length;
  const totalReserva = products.filter((p) => p.status === "reserva").length;

  // ================== Helpers formulario ==================

  function resetForm() {
    setFormId(null);
    setFormSku("");
    setFormBrand("");
    setFormDesc("");
    setFormType("maestro_frenos");
    setFormStatus("disponible");
    setFormEta("");
    setFormImgsText("");
    setFormError(null);
    setFormSaving(false);
  }

  function openCreateModal() {
    setModalMode("create");
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(p: Product) {
    setModalMode("edit");
    setFormId(p.id);
    setFormSku(p.sku);
    setFormBrand(p.brand);
    setFormDesc(p.desc);
    setFormType(p.type === "todo" ? "maestro_frenos" : p.type);
    setFormStatus(p.status);
    setFormEta(p.eta ?? "");
    setFormImgsText((p.imgs || []).join("\n"));
    setFormError(null);
    setFormSaving(false);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function mapStatusToDb(status: ProductStatus): string {
    switch (status) {
      case "disponible":
        return "DISPONIBLE";
      case "bajo":
        return "BAJO_STOCK";
      case "agotado":
        return "AGOTADO";
      case "reserva":
        return "RESERVA";
      default:
        return "DISPONIBLE";
    }
  }

  function mapTypeToDb(type: ProductType): string {
    switch (type) {
      case "maestro_frenos":
        return "MAESTRO_FRENOS";
      case "maestro_clutch":
        return "MAESTRO_CLUTCH";
      case "auxiliar_frenos":
        return "AUXILIAR_FRENOS";
      case "auxiliar_clutch":
        return "AUXILIAR_CLUTCH";
      case "pastillas_freno":
        return "PASTILLAS_FRENO";
      default:
        return "MAESTRO_FRENOS";
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const sku = formSku.trim();
    const marca = formBrand.trim();
    const descripcion = formDesc.trim();

    if (!sku || !marca || !descripcion) {
      setFormError("SKU, Marca y Descripción son obligatorios.");
      return;
    }

    const imagenes = formImgsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const etaClean =
      formStatus === "reserva" && formEta.trim().length > 0
        ? formEta.trim()
        : null;

    const payload: any = {
      sku,
      marca,
      descripcion,
      tipo: mapTypeToDb(formType),
      estado: mapStatusToDb(formStatus),
      eta: etaClean,
      precio: null, // se puede ampliar después
      imagenes,
    };

    if (formId) {
      payload.id = Number(formId);
    }

    try {
      setFormSaving(true);

      const res = await fetch("/api/productos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setFormError(json.error || "Error al guardar el producto.");
        setFormSaving(false);
        return;
      }

      // Recargamos la lista desde la BD para garantizar que todo está sincronizado
      await reloadProducts();
      setFormSaving(false);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error al guardar producto:", err);
      setFormError(err?.message ?? "Error al guardar el producto.");
      setFormSaving(false);
    }
  }

  async function handleDeleteProduct(p: Product) {
    const ok = window.confirm(
      `¿Eliminar el producto "${p.sku} - ${p.brand}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/productos/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(p.id) }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.error || "No se pudo eliminar el producto.");
        return;
      }

      // Quitamos de la lista local sin esperar un nuevo fetch
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      alert("Error al eliminar el producto.");
    }
  }

  // ================== Render ==================

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
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ marginBottom: 4 }}>Productos</h1>
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            Visor y gestor administrativo de productos reales (Neon).
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Total: <strong>{total}</strong> · Disponibles:{" "}
            <strong>{totalDisponible}</strong> · En reserva:{" "}
            <strong>{totalReserva}</strong>
          </div>
        </div>

        {/* Filtros + botón nuevo */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "flex-end",
            alignItems: "center",
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

          <button
            type="button"
            onClick={openCreateModal}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              background: "#ea9216",
              color: "#ffffff",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Nuevo producto
          </button>
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
                <th style={{ width: 140 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 16 }}>
                    No hay productos que coincidan con el filtro.
                  </td>
                </tr>
              )}

              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td
                    style={{
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco",
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
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: "1px solid #d1d5db",
                          fontSize: 12,
                          background: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: "none",
                          fontSize: 12,
                          background: "rgba(239,68,68,0.12)",
                          color: "#b91c1c",
                          cursor: "pointer",
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

      {/* ===== Modal de producto (crear / editar) ===== */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              borderRadius: 16,
              background: "#ffffff",
              padding: 20,
              boxShadow: "0 20px 40px rgba(15,23,42,0.28)",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {modalMode === "create"
                ? "Nuevo producto"
                : `Editar producto: ${formSku}`}
            </h2>
            <p
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              Gestiona los datos básicos del producto y las imágenes para
              catálogo.
            </p>

            {formError && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 10,
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: 13,
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <label
                    style={{ fontSize: 12, color: "#4b5563", display: "block" }}
                  >
                    SKU
                  </label>
                  <input
                    className="input"
                    style={{ width: "100%", fontSize: 13 }}
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    style={{ fontSize: 12, color: "#4b5563", display: "block" }}
                  >
                    Marca
                  </label>
                  <input
                    className="input"
                    style={{ width: "100%", fontSize: 13 }}
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{ fontSize: 12, color: "#4b5563", display: "block" }}
                >
                  Descripción
                </label>
                <textarea
                  className="input"
                  style={{ width: "100%", fontSize: 13, minHeight: 48 }}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#4b5563",
                      display: "block",
                    }}
                  >
                    Tipo
                  </label>
                  <select
                    className="input"
                    style={{ width: "100%", fontSize: 13 }}
                    value={formType}
                    onChange={(e) =>
                      setFormType(e.target.value as ProductType)
                    }
                  >
                    <option value="maestro_frenos">Maestro frenos</option>
                    <option value="maestro_clutch">Maestro clutch</option>
                    <option value="auxiliar_frenos">Auxiliar frenos</option>
                    <option value="auxiliar_clutch">Auxiliar clutch</option>
                    <option value="pastillas_freno">Pastillas freno</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#4b5563",
                      display: "block",
                    }}
                  >
                    Estado
                  </label>
                  <select
                    className="input"
                    style={{ width: "100%", fontSize: 13 }}
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as ProductStatus)
                    }
                  >
                    <option value="disponible">Disponible</option>
                    <option value="bajo">Bajo stock</option>
                    <option value="agotado">Agotado</option>
                    <option value="reserva">Reserva (en camino)</option>
                  </select>
                </div>
              </div>

              {formStatus === "reserva" && (
                <div style={{ marginBottom: 10 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#4b5563",
                      display: "block",
                    }}
                  >
                    ETA (ej: 15/12/2025, Ene 2026)
                  </label>
                  <input
                    className="input"
                    style={{ width: "100%", fontSize: 13 }}
                    value={formEta}
                    onChange={(e) => setFormEta(e.target.value)}
                  />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "#4b5563",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Imágenes (una URL por línea)
                </label>
                <textarea
                  className="input"
                  style={{
                    width: "100%",
                    fontSize: 12,
                    minHeight: 80,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                  }}
                  placeholder={"/img/kolben/47201-04150-frente.png\n/img/kolben/47201-04150-lado.png"}
                  value={formImgsText}
                  onChange={(e) => setFormImgsText(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formSaving}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "none",
                    background: "#ea9216",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    opacity: formSaving ? 0.7 : 1,
                  }}
                >
                  {formSaving
                    ? "Guardando..."
                    : modalMode === "create"
                    ? "Crear producto"
                    : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
