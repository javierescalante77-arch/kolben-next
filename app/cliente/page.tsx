"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import "./cliente.css";

/* ================== Tipos ================== */

type ProductStatus = "disponible" | "bajo" | "agotado" | "reserva";

type ProductType =
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
  type: ProductType | string;
  imgs: string[];
  eta?: string | null;
};

type CartItem = {
  product: Product;
  qtyA: number;
  qtyB: number;
  qtyC: number;
};

type OrderStatus = "pendiente" | "preparando" | "enviado";

type Order = {
  id: number;
  createdAt: string;
  status: OrderStatus;
  items: CartItem[];
};

type TabKey = "catalog" | "cart" | "orders";

type ChipKey =
  | "todo"
  | "favoritos"
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch"
  | "pastillas_freno";

type ClienteLite = {
  id: number;
  nombre: string;
  codigo: string;
  sucursales: 1 | 2 | 3;
};

/* ================== Chips catálogo ================== */

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: "todo", label: "Todo" },
  { key: "favoritos", label: "⭐ Favoritos" },
  { key: "maestro_frenos", label: "Maestro de frenos" },
  { key: "maestro_clutch", label: "Maestro de clutch" },
  { key: "auxiliar_frenos", label: "Auxiliar de frenos" },
  { key: "auxiliar_clutch", label: "Auxiliar de clutch" },
  { key: "pastillas_freno", label: "Pastillas de freno" },
];

/* ================== Helpers visuales ================== */

function pillFor(status: ProductStatus, eta?: string | null) {
  switch (status) {
    case "disponible":
      return <span className="pill ok">Disponible</span>;
    case "bajo":
      return <span className="pill low">Bajo stock</span>;
    case "agotado":
      return <span className="pill bad">Agotado</span>;
    case "reserva": {
      const label = eta && eta.trim() ? `En camino · ${eta}` : "En camino";
      return <span className="pill res">{label}</span>;
    }
    default:
      return null;
  }
}

/* ================== Tarjeta de producto ================== */

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  const [favorite, setFavorite] = useState(false);

  // Cargar favorito desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fav_" + product.id);
      setFavorite(stored === "1");
    } catch {
      // ignorar errores de localStorage
    }
  }, [product.id]);

  const toggleFavorite = () => {
    const next = !favorite;
    setFavorite(next);
    try {
      if (next) localStorage.setItem("fav_" + product.id, "1");
      else localStorage.removeItem("fav_" + product.id);
    } catch {
      // ignorar
    }
  };

  const hasFotosExtra = product.imgs && product.imgs.length > 1;
  const isDisabled = product.status === "agotado";
  const buttonLabel = product.status === "reserva" ? "Reservar" : "Agregar";

  const mainImg =
    product.imgs && product.imgs.length > 0
      ? product.imgs[0]
      : "/img/placeholder.png";

  return (
    <div className="card">
      {/* Bloque superior (imagen + SKU) */}
      <div className="media-block">
        <div className="img-wrap">
          <Image
            src={mainImg}
            alt={product.desc || product.sku}
            fill
            sizes="(max-width: 767px) 50vw, 25vw"
          />
          {hasFotosExtra && (
            <span className="photos-chip">{product.imgs.length} fotos</span>
          )}
        </div>

        <div className="sku-center">
          <span className="sku">{product.sku}</span>
        </div>
      </div>

      {/* Contenido inferior */}
      <div className="card-inner">
        {/* Marca + estrella */}
        <div className="brandline">
          <span className="brand-txt">{product.brand}</span>
          <button
            type="button"
            className={`fav-btn ${favorite ? "active" : ""}`}
            onClick={toggleFavorite}
          >
            ★
          </button>
        </div>

        <div className="desc">{product.desc}</div>

        {/* Píldora + botón */}
        <div className="card-foot">
          {pillFor(product.status, product.eta)}

          <button
            type="button"
            className={`add ${isDisabled ? "disabled" : ""}`}
            disabled={isDisabled}
            onClick={() => onAdd(product)}
          >
            <span className="plus">+</span>
            <span>{buttonLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================== Página Cliente ================== */

export default function ClientePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("catalog");

  const [chip, setChip] = useState<ChipKey>("todo");
  const [query, setQuery] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Cliente actual + sucursales
  const [cliente, setCliente] = useState<ClienteLite | null>(null);
  const [clienteLoading, setClienteLoading] = useState(false);
  const [clienteError, setClienteError] = useState<string | null>(null);

  // Si no hay cliente aún, por defecto 3 sucursales (modo demo seguro)
  const sucursalesActivas: 1 | 2 | 3 =
    (cliente?.sucursales as 1 | 2 | 3) ?? 3;

  /* ==== Cargar productos desde /api/productos/list ==== */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch("/api/productos/list");
        const json = await res.json();

        // Soporta array directo o { ok, data }
        const data: Product[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];

        setProducts(
          data.map((p) => ({
            ...p,
            eta: (p as any).eta ?? null,
          }))
        );
      } catch (err: any) {
        console.error("Error cargando productos (cliente):", err);
        setErrorMsg(err?.message ?? "No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ==== Cargar cliente actual (demo: primer cliente activo) ==== */

  useEffect(() => {
    const loadClienteActual = async () => {
      try {
        setClienteLoading(true);
        setClienteError(null);

        const res = await fetch("/api/clientes/list");
        if (!res.ok) throw new Error("Error cargando cliente");

        const data = (await res.json()) as any[];

        const activo = data.find((c) => c.activo) ?? data[0];

        if (!activo) {
          setCliente(null);
          return;
        }

        let suc: 1 | 2 | 3 = 1;
        if (activo.sucursales === 2) suc = 2;
        if (activo.sucursales === 3) suc = 3;

        setCliente({
          id: Number(activo.id),
          nombre: String(activo.nombre ?? ""),
          codigo: String(activo.codigo ?? ""),
          sucursales: suc,
        });
      } catch (err) {
        console.error("Error en loadClienteActual:", err);
        setClienteError("No se pudo cargar el cliente activo.");
        setCliente(null);
      } finally {
        setClienteLoading(false);
      }
    };

    loadClienteActual();
  }, []);

  /* ==== Filtro catálogo (chips + buscador) ==== */

  const filteredProducts = useMemo(() => {
    let result = products;

    if (chip !== "todo") {
      if (chip === "favoritos") {
        // Filtrar por favoritos guardados en localStorage
        try {
          result = result.filter((p) => {
            const stored = localStorage.getItem("fav_" + p.id);
            return stored === "1";
          });
        } catch {
          result = [];
        }
      } else {
        result = result.filter((p) => p.type === chip);
      }
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, chip, query]);

  /* ==== Carrito ==== */

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        // Suma 1 a sucursal A por defecto
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, qtyA: item.qtyA + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          qtyA: 1,
          qtyB: 0,
          qtyC: 0,
        },
      ];
    });
  };

  const updateCartQty = (
    productId: string,
    branch: "A" | "B" | "C",
    value: number
  ) => {
    const n = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

    setCart((prev) => {
      const next = prev.map((item) => {
        if (item.product.id !== productId) return item;

        const updated = { ...item };

        if (branch === "A") updated.qtyA = n;
        if (branch === "B") updated.qtyB = n;
        if (branch === "C") updated.qtyC = n;

        return updated;
      });

      // Eliminar líneas totalmente en 0
      return next.filter(
        (item) => item.qtyA > 0 || item.qtyB > 0 || item.qtyC > 0
      );
    });
  };

  const totalPiezas = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + item.qtyA + item.qtyB + item.qtyC,
        0
      ),
    [cart]
  );

  const handleSendOrder = () => {
    if (cart.length === 0) return;

    // Ajustar cantidades según sucursales activas
    const sanitizedItems: CartItem[] = cart.map((item) => ({
      ...item,
      qtyA: sucursalesActivas >= 1 ? item.qtyA : 0,
      qtyB: sucursalesActivas >= 2 ? item.qtyB : 0,
      qtyC: sucursalesActivas >= 3 ? item.qtyC : 0,
    }));

    const newOrder: Order = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: "pendiente",
      items: sanitizedItems,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
  };

  /* ==== Render de tabs ==== */

  const renderCatalogView = () => (
    <section className="panel">
      {/* Chips de filtro */}
      <div className="chips">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`chip ${chip === c.key ? "active" : ""}`}
            onClick={() => setChip(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="row">
        <input
          type="text"
          placeholder="Buscar por código, marca, modelo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="btn light"
          onClick={() => setQuery("")}
        >
          Limpiar
        </button>
      </div>

      {/* Mensajes de estado */}
      {loading && (
        <div style={{ padding: "12px 0" }}>Cargando productos…</div>
      )}

      {errorMsg && !loading && (
        <div style={{ padding: "12px 0", color: "#b91c1c" }}>{errorMsg}</div>
      )}

      {!loading && !errorMsg && filteredProducts.length === 0 && (
        <div style={{ padding: "12px 0" }}>
          No hay productos que coincidan con el filtro.
        </div>
      )}

      {/* Grid de productos */}
      <div data-kolben>
        <div className="grid">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={handleAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );

  const renderCartView = () => (
    <section className="panel">
      {/* Info de cliente y sucursales */}
      <div
        style={{
          marginBottom: 12,
          fontSize: 13,
          color: "#4b5563",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        {clienteLoading && <span>Cargando cliente…</span>}
        {clienteError && (
          <span style={{ color: "#b91c1c" }}>{clienteError}</span>
        )}
        {cliente && !clienteLoading && !clienteError && (
          <>
            <span>
              Cliente: <strong>{cliente.nombre}</strong> ({cliente.codigo})
            </span>
            <span>·</span>
            <span>
              Sucursales activas: <strong>{sucursalesActivas}</strong>
            </span>
          </>
        )}
      </div>

      {cart.length === 0 ? (
        <div style={{ padding: "12px 0" }}>
          Tu carrito está vacío. Agrega productos desde el catálogo.
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cart.map((item) => (
              <div className="cart-item" key={item.product.id}>
                <div className="cart-item-main">
                  <span className="cart-item-title">
                    {item.product.sku}
                  </span>
                  <span className="cart-item-meta">
                    {item.product.brand} · {item.product.desc}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                  }}
                >
                  {sucursalesActivas >= 1 && (
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          marginBottom: 4,
                          color: "#4b5563",
                        }}
                      >
                        Suc. A
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={item.qtyA}
                        onChange={(e) =>
                          updateCartQty(
                            item.product.id,
                            "A",
                            Number(e.target.value)
                          )
                        }
                        style={{
                          width: 72,
                          padding: "4px 6px",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          fontSize: 14,
                        }}
                      />
                    </div>
                  )}

                  {sucursalesActivas >= 2 && (
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          marginBottom: 4,
                          color: "#4b5563",
                        }}
                      >
                        Suc. B
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={item.qtyB}
                        onChange={(e) =>
                          updateCartQty(
                            item.product.id,
                            "B",
                            Number(e.target.value)
                          )
                        }
                        style={{
                          width: 72,
                          padding: "4px 6px",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          fontSize: 14,
                        }}
                      />
                    </div>
                  )}

                  {sucursalesActivas >= 3 && (
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          marginBottom: 4,
                          color: "#4b5563",
                        }}
                      >
                        Suc. C
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={item.qtyC}
                        onChange={(e) =>
                          updateCartQty(
                            item.product.id,
                            "C",
                            Number(e.target.value)
                          )
                        }
                        style={{
                          width: 72,
                          padding: "4px 6px",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          fontSize: 14,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-total">Total piezas: {totalPiezas}</div>

          <div className="mt-12" style={{ textAlign: "right" }}>
            <button
              type="button"
              className="btn"
              onClick={handleSendOrder}
            >
              Enviar pedido (demo)
            </button>
          </div>
        </>
      )}
    </section>
  );

  const renderOrdersView = () => (
    <section className="panel">
      {orders.length === 0 ? (
        <div style={{ padding: "12px 0" }}>
          Aún no tienes pedidos registrados en esta sesión.
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-item" key={order.id}>
              <div className="cart-item-main">
                <span className="cart-item-title">
                  Pedido #{order.id}
                </span>
                <span className="cart-item-meta">
                  {new Date(order.createdAt).toLocaleString()} ·{" "}
                  {order.items.length} productos
                </span>
              </div>
              <div className="cart-qty">
                <span>{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="cliente-container">
      {/* Tabs superiores (internas del cliente) */}
      <div className="cliente-tabs">
        <button
          type="button"
          className={activeTab === "catalog" ? "active" : ""}
          onClick={() => setActiveTab("catalog")}
        >
          Catálogo
        </button>
        <button
          type="button"
          className={activeTab === "cart" ? "active" : ""}
          onClick={() => setActiveTab("cart")}
        >
          Carrito ({cart.length})
        </button>
        <button
          type="button"
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          Pedidos
        </button>
      </div>

      {/* Contenido de cada tab */}
      {activeTab === "catalog" && renderCatalogView()}
      {activeTab === "cart" && renderCartView()}
      {activeTab === "orders" && renderOrdersView()}
    </div>
  );
}
