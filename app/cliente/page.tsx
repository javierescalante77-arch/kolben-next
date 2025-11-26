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

type EstadoPedidoApi = "PENDIENTE" | "PREPARANDO" | "ENVIADO";

type PedidoResumen = {
  id: number;
  createdAt: string;
  estado: EstadoPedidoApi;
  itemsCount: number;
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

function estadoPedidoLabel(e: EstadoPedidoApi): string {
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

/* ================== Tarjeta de producto ================== */

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  const [favorite, setFavorite] = useState(false);

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
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  // Cliente actual + sucursales
  const [cliente, setCliente] = useState<ClienteLite | null>(null);
  const [clienteLoading, setClienteLoading] = useState(false);
  const [clienteError, setClienteError] = useState<string | null>(null);

  // Pedidos reales
  const [orders, setOrders] = useState<PedidoResumen[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Estado de envío de pedido
  const [sendingOrder, setSendingOrder] = useState(false);
  const [sendOrderError, setSendOrderError] = useState<string | null>(null);
  const [sendOrderOk, setSendOrderOk] = useState<string | null>(null);

  // Si no hay cliente aún, por defecto 3 sucursales (modo demo seguro)
  const sucursalesActivas: 1 | 2 | 3 =
    (cliente?.sucursales as 1 | 2 | 3) ?? 3;

  /* ==== Cargar productos desde /api/productos/list ==== */

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProducts(true);
        setProductsError(null);

        const res = await fetch("/api/productos/list");
        const json = await res.json();

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
        setProductsError(
          err?.message ?? "No se pudieron cargar los productos."
        );
      } finally {
        setLoadingProducts(false);
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

  /* ==== Cargar pedidos reales para el cliente ==== */

  async function loadPedidosCliente(clienteId?: number | null) {
    try {
      if (!clienteId) {
        setOrders([]);
        return;
      }

      setOrdersLoading(true);
      setOrdersError(null);

      const res = await fetch("/api/pedidos/list");
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Error al listar pedidos");
      }

      const data = (json.data || []) as any[];

      const filtered = data.filter(
        (p: any) => p.cliente && Number(p.cliente.id) === clienteId
      );

      const mapped: PedidoResumen[] = filtered.map((p: any) => {
        const items = Array.isArray(p.items) ? p.items : [];
        let count = 0;
        for (const it of items) {
          const a = Number(it.cantidadA ?? 0);
          const b = Number(it.cantidadB ?? 0);
          const c = Number(it.cantidadC ?? 0);
          count += a + b + c;
        }

        return {
          id: Number(p.id),
          createdAt: String(p.createdAt),
          estado: p.estado as EstadoPedidoApi,
          itemsCount: count,
        };
      });

      setOrders(mapped);
    } catch (err: any) {
      console.error("Error cargando pedidos cliente:", err);
      setOrdersError(err.message || "Error al cargar pedidos");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  // Cargar pedidos cada vez que cambie el cliente
  useEffect(() => {
    if (cliente?.id) {
      loadPedidosCliente(cliente.id);
    }
  }, [cliente?.id]);

  /* ==== Filtro catálogo (chips + buscador) ==== */

  const filteredProducts = useMemo(() => {
    let result = products;

    if (chip !== "todo") {
      if (chip === "favoritos") {
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

  /* ==== Enviar pedido real a /api/pedidos/create ==== */

  const handleSendOrder = async () => {
    if (cart.length === 0) return;

    try {
      setSendingOrder(true);
      setSendOrderError(null);
      setSendOrderOk(null);

      // Ajustar cantidades según sucursales activas
      const sanitized = cart.map((item) => ({
        product: item.product,
        qtyA: sucursalesActivas >= 1 ? item.qtyA : 0,
        qtyB: sucursalesActivas >= 2 ? item.qtyB : 0,
        qtyC: sucursalesActivas >= 3 ? item.qtyC : 0,
      }));

      const itemsBody = sanitized
        .map((it) => {
          const total =
            (it.qtyA ?? 0) + (it.qtyB ?? 0) + (it.qtyC ?? 0);
          if (total <= 0) return null;

          const tipo =
            it.product.status === "reserva" ? "RESERVA" : "NORMAL";

          return {
            sku: it.product.sku,
            cantidadA: it.qtyA,
            cantidadB: it.qtyB,
            cantidadC: it.qtyC,
            tipo,
            estadoTexto: null,
            etaTexto: it.product.eta ?? null,
          };
        })
        .filter(Boolean) as {
        sku: string;
        cantidadA: number;
        cantidadB: number;
        cantidadC: number;
        tipo: "NORMAL" | "RESERVA";
        estadoTexto: string | null;
        etaTexto: string | null;
      }[];

      if (itemsBody.length === 0) {
        setSendOrderError(
          "No hay cantidades válidas para enviar en el pedido."
        );
        return;
      }

      const body = {
        clienteId: cliente?.id ?? undefined,
        comentario: null,
        dispositivo: "cliente-web",
        items: itemsBody,
      };

      const res = await fetch("/api/pedidos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Error al crear el pedido");
      }

      setCart([]);
      setSendOrderOk("Pedido enviado correctamente.");
      setActiveTab("orders");

      if (cliente?.id) {
        await loadPedidosCliente(cliente.id);
      }
    } catch (err: any) {
      console.error("Error enviando pedido desde cliente:", err);
      setSendOrderError(
        err.message || "Error al enviar el pedido. Intenta de nuevo."
      );
    } finally {
      setSendingOrder(false);
    }
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
      {loadingProducts && (
        <div style={{ padding: "12px 0" }}>Cargando productos…</div>
      )}

      {productsError && !loadingProducts && (
        <div style={{ padding: "12px 0", color: "#b91c1c" }}>
          {productsError}
        </div>
      )}

      {!loadingProducts && !productsError && filteredProducts.length === 0 && (
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

          {sendOrderError && (
            <div
              style={{
                marginTop: 8,
                color: "#b91c1c",
                fontSize: 13,
              }}
            >
              {sendOrderError}
            </div>
          )}

          {sendOrderOk && (
            <div
              style={{
                marginTop: 8,
                color: "#166534",
                fontSize: 13,
              }}
            >
              {sendOrderOk}
            </div>
          )}

          <div className="mt-12" style={{ textAlign: "right" }}>
            <button
              type="button"
              className="btn"
              onClick={handleSendOrder}
              disabled={sendingOrder}
            >
              {sendingOrder ? "Enviando pedido..." : "Enviar pedido"}
            </button>
          </div>
        </>
      )}
    </section>
  );

  const renderOrdersView = () => (
    <section className="panel">
      <div
        style={{
          marginBottom: 8,
          fontSize: 13,
          color: "#4b5563",
        }}
      >
        {cliente && (
          <>
            Pedidos de: <strong>{cliente.nombre}</strong> ({cliente.codigo})
          </>
        )}
      </div>

      {ordersLoading && (
        <p style={{ padding: "8px 0", fontSize: 13 }}>
          Cargando pedidos…
        </p>
      )}

      {ordersError && (
        <p
          style={{
            padding: "8px 0",
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          {ordersError}
        </p>
      )}

      {!ordersLoading && !ordersError && orders.length === 0 && (
        <p style={{ padding: "8px 0", fontSize: 13 }}>
          Aún no tienes pedidos registrados.
        </p>
      )}

      {orders.length > 0 && (
        <div className="orders-list">
          {orders.map((o) => (
            <div className="order-item" key={o.id}>
              <div className="cart-item-main">
                <span className="cart-item-title">
                  Pedido #{o.id}
                </span>
                <span className="cart-item-meta">
                  {new Date(o.createdAt).toLocaleString()} ·{" "}
                  {o.itemsCount} piezas
                </span>
              </div>
              <div className="cart-qty">
                <span>{estadoPedidoLabel(o.estado)}</span>
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
