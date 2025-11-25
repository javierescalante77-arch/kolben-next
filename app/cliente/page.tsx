"use client";

import { useMemo, useState, useEffect } from "react";
import "./cliente.css";

/* ================== Tipos ================== */

type ProductStatus =
  | "Disponible"
  | "Bajo stock"
  | "Agotado"
  | "Reservar (en camino)";

type Product = {
  sku: string;
  brand: string;
  desc: string;
  status: ProductStatus;
  imgs: string[];
};

type CartItem = {
  product: Product;
  qtyA: number;
  qtyB: number;
  qtyC: number;
};

type OrderStatus = "Pendiente" | "Preparando" | "Enviado";

type Order = {
  id: number;
  items: CartItem[];
  createdAt: string;
  status: OrderStatus;
};

type ChipKey =
  | "todo"
  | "favoritos"
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch"
  | "pastillas_freno";

/* ================== Datos de demo ================== */

const sampleProducts: Product[] = [
  {
    sku: "47201-04150",
    brand: "Toyota",
    desc: "Tacoma 05–15 Automático 15/16",
    status: "Disponible",
    imgs: ["/placeholder-1.png"],
  },
  {
    sku: "47201-60460",
    brand: "Toyota",
    desc: "Cilindro maestro Corolla 3 tornillos 13/16",
    status: "Reservar (en camino)",
    imgs: ["/placeholder-2.png"],
  },
  {
    sku: "47210-AD200",
    brand: "Nissan",
    desc: "Cilindro maestro Tiida 95–05",
    status: "Bajo stock",
    imgs: ["/placeholder-3.png"],
  },
  {
    sku: "KB-001",
    brand: "Kolben",
    desc: "Cilindro maestro de frenos delantero · sedán compacto",
    status: "Disponible",
    imgs: ["/placeholder-4.png"],
  },
];

/* ================== Helpers visuales ================== */

function pillFor(status: ProductStatus) {
  if (status === "Agotado") {
    return <span className="pill bad">Agotado</span>;
  }
  if (status === "Bajo stock") {
    return <span className="pill low">Bajo stock</span>;
  }
  if (status === "Reservar (en camino)") {
    return <span className="pill res">Llegando</span>;
  }
  return <span className="pill ok">Disponible</span>;
}

function firstImg(p: Product) {
  const src = p.imgs && p.imgs[0];
  if (src) {
    return <img src={src} alt={p.sku} />;
  }

  return (
    <svg
      width="140"
      height="96"
      viewBox="0 0 140 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="12" width="124" height="72" fill="#e5e7eb" />
      <circle cx="48" cy="46" r="14" fill="#d1d5db" />
      <path
        d="M68 70L88 44L108 70H68Z"
        fill="#c4cad4"
        stroke="#dbe1ea"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ================== Tarjeta de producto ================== */

type ProductCardProps = {
  p: Product;
  isFav: boolean;
  toggleFav: (sku: string) => void;
  onAdd: (p: Product) => void;
};

function ProductCard({ p, isFav, toggleFav, onAdd }: ProductCardProps) {
  const isReserva = p.status === "Reservar (en camino)";

  const handleClick = () => {
    if (p.status === "Agotado") return;
    onAdd(p);
  };

  return (
    <div className="card" data-sku={p.sku}>
      {/* Imagen */}
      <div className="media-block">
        <div className="img-wrap">{firstImg(p)}</div>
      </div>

      {/* Contenido */}
      <div className="card-inner">
        <div className="sku-center">
          <div className="sku">{p.sku}</div>
        </div>

        <div className="brandline">
          <div className="brand-txt">{p.brand}</div>
          <button
            className={isFav ? "fav-btn active" : "fav-btn"}
            data-sku={p.sku}
            onClick={(e) => {
              e.stopPropagation();
              toggleFav(p.sku);
            }}
          >
            ★
          </button>
        </div>

        <div className="desc">{p.desc}</div>

        <div className="card-foot">
          {pillFor(p.status)}

          {p.status === "Agotado" ? (
            <button className="add" style={{ opacity: 0.5 }} disabled>
              Agotado
            </button>
          ) : (
            <button
              className="add"
              data-type={isReserva ? "reserva" : "normal"}
              onClick={handleClick}
            >
              <span className="plus">+</span>
              {isReserva ? "Reservar" : "Agregar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================== Página Cliente ================== */

export default function ClientePage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "cart" | "orders">(
    "catalog"
  );
  const [activeChip, setActiveChip] = useState<ChipKey>("todo");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("Agregado");
  const [alias, setAlias] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);


  // 1 = sólo A, 2 = A+B, 3 = A+B+C
  const sucursalesActivas: 1 | 2 | 3 = 3;

  /* ===== Alias de usuario (badge) ===== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedAlias =
      window.localStorage.getItem("kolben_alias") ||
      window.localStorage.getItem("alias");

    if (storedAlias && storedAlias.trim()) {
      setAlias(storedAlias.trim());
    } else {
      setAlias("N");
    }
  }, []);

  /* ===== Favoritos en localStorage ===== */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("kolben_favs");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setFavorites(parsed);
    } catch {
      // silencioso
    }
  }, []);

  const persistFavorites = (next: string[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("kolben_favs", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const toggleFavorite = (sku: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(sku);
      const next = exists ? prev.filter((s) => s !== sku) : [...prev, sku];
      persistFavorites(next);
      return next;
    });
  };

  /* ===== Filtro catálogo ===== */

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return sampleProducts.filter((p) => {
      if (q) {
        const textMatch =
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q);
        if (!textMatch) return false;
      }

      if (activeChip === "favoritos") {
        return favorites.includes(p.sku);
      }

      // resto de chips, por ahora, se comportan como "Todo"
      return true;
    });
  }, [search, activeChip, favorites]);

  /* ===== Carrito ===== */

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.sku === product.sku);
      if (idx === -1) {
        return [
          ...prev,
          {
            product,
            qtyA: 1,
            qtyB: sucursalesActivas >= 2 ? 1 : 0,
            qtyC: sucursalesActivas >= 3 ? 1 : 0,
          },
        ];
      }
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        qtyA: copy[idx].qtyA + 1,
      };
      return copy;
    });

  setToastMessage("Agregado");
  setToastVisible(true);
  setTimeout(() => setToastVisible(false), 1300);

  };

  const handleQtyInputChange = (
    sku: string,
    branch: "A" | "B" | "C",
    value: string
  ) => {
    const parsed = parseInt(value, 10);
    const safe = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.sku !== sku) return item;
        if (branch === "A") return { ...item, qtyA: safe };
        if (branch === "B") return { ...item, qtyB: safe };
        return { ...item, qtyC: safe };
      })
    );
  };

  const handleRemoveItem = (sku: string) => {
    setCart((prev) => prev.filter((item) => item.product.sku !== sku));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    window.location.href = "/login";
  };

const handleSendOrder = () => {
  if (cart.length === 0) {
    return;
  }

  setOrders((prev) => [
    ...prev,
    {
      id: prev.length + 1,
      items: cart,
      createdAt: new Date().toISOString(),
      status: "Pendiente",
    },
  ]);

  setCart([]);
  setActiveTab("orders");

  setToastMessage("Pedido enviado");
  setToastVisible(true);
  setTimeout(() => setToastVisible(false), 1300);
};


  const getOrderBranchTotals = (order: Order) => {
    let totalA = 0;
    let totalB = 0;
    let totalC = 0;

    order.items.forEach((item) => {
      totalA += item.qtyA;
      totalB += item.qtyB;
      totalC += item.qtyC;
    });

    return { totalA, totalB, totalC };
  };

  const handleEditOrder = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.status !== "Pendiente") {
      alert(
        "Este pedido ya está en preparación o enviado y no puede modificarse."
      );
      return;
    }

    setCart(order.items.map((item) => ({ ...item })));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setActiveTab("cart");
  };

  /* ================== Vistas ================== */

  const renderCatalogView = () => (
    <>
      <div className="chips" id="chips">
        <button
          className={`chip ${activeChip === "todo" ? "active" : ""}`}
          onClick={() => setActiveChip("todo")}
        >
          Todo
        </button>
        <button
          className={`chip ${activeChip === "favoritos" ? "active" : ""}`}
          onClick={() => setActiveChip("favoritos")}
        >
          ⭐ Favoritos
        </button>
        <button
          className={`chip ${
            activeChip === "maestro_frenos" ? "active" : ""
          }`}
          onClick={() => setActiveChip("maestro_frenos")}
        >
          Maestro frenos
        </button>
        <button
          className={`chip ${
            activeChip === "maestro_clutch" ? "active" : ""
          }`}
          onClick={() => setActiveChip("maestro_clutch")}
        >
          Maestro clutch
        </button>
        <button
          className={`chip ${
            activeChip === "auxiliar_frenos" ? "active" : ""
          }`}
          onClick={() => setActiveChip("auxiliar_frenos")}
        >
          Auxiliar frenos
        </button>
        <button
          className={`chip ${
            activeChip === "auxiliar_clutch" ? "active" : ""
          }`}
          onClick={() => setActiveChip("auxiliar_clutch")}
        >
          Auxiliar clutch
        </button>
        <button
          className={`chip ${
            activeChip === "pastillas_freno" ? "active" : ""
          }`}
          onClick={() => setActiveChip("pastillas_freno")}
        >
          Pastillas frenos
        </button>
      </div>

      <div className="row">
        <input
          id="q"
          placeholder="Buscar por código, descripción o marca"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn light" onClick={() => setSearch("")}>
          Limpiar
        </button>
      </div>

      <div className="grid" id="grid">
        {filteredProducts.map((p) => (
          <ProductCard
            key={p.sku}
            p={p}
            onAdd={handleAddToCart}
            isFav={favorites.includes(p.sku)}
            toggleFav={toggleFavorite}
          />
        ))}
      </div>
    </>
  );

  const renderCartView = () => {
    const totalCols =
      8 +
      (sucursalesActivas >= 2 ? 1 : 0) +
      (sucursalesActivas >= 3 ? 1 : 0);

    return (
      <>
        <h1 style={{ marginBottom: 16 }}>Carrito</h1>

        {/* Banda azul igual al carrito admin */}
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

        {/* ============================
            Escritorio / tablet (PC)
            ============================ */}
        <div className="desktop-only">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>ETA</th>
                  <th>Tipo</th>
                  <th>Cantidad sucursal A</th>
                  {sucursalesActivas >= 2 && (
                    <th>Cantidad sucursal B</th>
                  )}
                  {sucursalesActivas >= 3 && (
                    <th>Cantidad sucursal C</th>
                  )}
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={totalCols} style={{ textAlign: "center" }}>
                      Tu carrito está vacío. Agrega productos desde el
                      catálogo.
                    </td>
                  </tr>
                ) : (
                  cart.map((item, index) => {
                    const isReserva =
                      item.product.status === "Reservar (en camino)";
                    const tipo = isReserva ? "reserva" : "normal";
                    const etaText = isReserva ? "25 Enero" : "-";

                    return (
                      <tr key={item.product.sku}>
                        <td>{index + 1}</td>
                        <td>{item.product.sku}</td>
                        <td>{item.product.desc}</td>
                        <td>
                          <div className="cart-card-estado">
                            {pillFor(item.product.status)}
                          </div>
                        </td>
                        <td>{etaText}</td>
                        <td>{tipo}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={item.qtyA}
                            onChange={(e) =>
                              handleQtyInputChange(
                                item.product.sku,
                                "A",
                                e.target.value
                              )
                            }
                            style={{ width: 60 }}
                          />
                        </td>
                        {sucursalesActivas >= 2 && (
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={item.qtyB}
                              onChange={(e) =>
                                handleQtyInputChange(
                                  item.product.sku,
                                  "B",
                                  e.target.value
                                )
                              }
                              style={{ width: 60 }}
                            />
                          </td>
                        )}
                        {sucursalesActivas >= 3 && (
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={item.qtyC}
                              onChange={(e) =>
                                handleQtyInputChange(
                                  item.product.sku,
                                  "C",
                                  e.target.value
                                )
                              }
                              style={{ width: 60 }}
                            />
                          </td>
                        )}
                        <td>
                          <button
                            className="btn-ghost"
                            onClick={() =>
                              handleRemoveItem(item.product.sku)
                            }
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {cart.length > 0 && (
            <div
              className="row"
              style={{ justifyContent: "space-between", marginTop: 16 }}
            >
              <button
                className="btn-ghost"
                onClick={() => setActiveTab("catalog")}
              >
                Catálogo
              </button>
              <button
                className="btn primary"
                onClick={handleSendOrder}
              >
                Enviar orden
              </button>
            </div>
          )}
        </div>

        {/* ============================
            Móvil: mantiene layout cards
            ============================ */}
        <div className="mobile-only">
          <div className="cart-cards">
            {cart.length === 0 ? (
              <div className="cart-card cart-card-empty">
                <div>Tu carrito está vacío.</div>
                <div>Agrega productos desde el catálogo.</div>
              </div>
            ) : (
              cart.map((item, index) => (
                <article key={item.product.sku} className="cart-card">
                  <header className="cart-card-head">
                    <div className="cart-card-code">
                      {index + 1}. {item.product.sku}
                    </div>
                    <div className="cart-card-estado">
                      {pillFor(item.product.status)}
                    </div>
                  </header>

                  <div className="cart-card-desc">
                    {item.product.desc}
                  </div>

                  {/* Cantidad sucursal A */}
                  <div className="cart-card-qty-row">
                    <span className="qty-label">Cantidad sucursal A</span>
                    <input
                      className="qty-input"
                      type="number"
                      min={0}
                      value={item.qtyA}
                      onChange={(e) =>
                        handleQtyInputChange(
                          item.product.sku,
                          "A",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  {/* Cantidad sucursal B */}
                  {sucursalesActivas >= 2 && (
                    <div className="cart-card-qty-row">
                      <span className="qty-label">Cantidad sucursal B</span>
                      <input
                        className="qty-input"
                        type="number"
                        min={0}
                        value={item.qtyB}
                        onChange={(e) =>
                          handleQtyInputChange(
                            item.product.sku,
                            "B",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}

                  {/* Cantidad sucursal C */}
                  {sucursalesActivas >= 3 && (
                    <div className="cart-card-qty-row">
                      <span className="qty-label">Cantidad sucursal C</span>
                      <input
                        className="qty-input"
                        type="number"
                        min={0}
                        value={item.qtyC}
                        onChange={(e) =>
                          handleQtyInputChange(
                            item.product.sku,
                            "C",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}

                  <div className="cart-card-actions">
                    <button
                      className="btn-ghost"
                      onClick={() =>
                        handleRemoveItem(item.product.sku)
                      }
                    >
                      Quitar
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div
              className="row"
              style={{ justifyContent: "space-between" }}
            >
              <button
                className="btn-ghost"
                onClick={handleSendOrder}
              >
                Catálogo
              </button>
              <button
                className="btn primary"
                onClick={handleSendOrder}
              >
                Enviar orden
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  /* ========= NUEVA VISTA DE PEDIDOS (cliente) =========
     Copiamos el layout visual del admin: título + orders-grid
     con tarjetas .panel casi idénticas. El cliente ve el status
     pero NO lo puede cambiar (select deshabilitado).          */

  const renderOrdersView = () => (
    <>
      <h1 style={{ marginBottom: 20 }}>Pedidos</h1>

      {orders.length === 0 && (
        <div className="panel" style={{ padding: 24, textAlign: "center" }}>
          Aún no has enviado pedidos.
        </div>
      )}

      <div className="orders-grid">
        {orders.map((order) => {
          const { totalA, totalB, totalC } = getOrderBranchTotals(order);

          const fechaTexto = new Date(order.createdAt).toLocaleString("es-HN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });

          const puedeEditar = order.status === "Pendiente";
          const isExpanded = expandedOrderId === order.id;

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
              {/* ==== CABECERA SUPERIOR (igual admin) ==== */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                  gap: 16,
                }}
              >
                {/* Lado izquierdo: fecha + código + totales */}
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
                      {fechaTexto}
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
                      PC
                    </span>
                  </div>

                  <h2 style={{ margin: 0, marginBottom: 4 }}>
                    {`ORD-${String(order.id).toString().padStart(3, "0")}`}
                  </h2>

                  <div
                    style={{
                      fontSize: 14,
                      color: "#4b5563",
                      marginBottom: 2,
                    }}
                  >
                    Ítems{" "}
                    <span style={{ fontWeight: 600 }}>
                      {order.items.length}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    A: {totalA}
                    {sucursalesActivas >= 2 && <> · B: {totalB}</>}
                    {sucursalesActivas >= 3 && <> · C: {totalC}</>}
                  </div>
                </div>

                {/* Lado derecho: Status (solo lectura) */}
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
                    value={order.status}
                    disabled
                    style={{
                      padding: "6px 12px",
                      minWidth: 140,
                      fontSize: 14,
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      color: "#111827",
                    }}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Preparando">Preparando</option>
                    <option value="Enviado">Enviado</option>
                  </select>
                </div>
              </div>

              {/* ==== BOTONES ==== */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 16,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {/* PDF */}
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

                {/* Ver detalle (plegable) */}
                <button
                  type="button"
                  className="btn light"
                  style={{
                    padding: "8px 20px",
                    borderRadius: 999,
                    fontSize: 14,
                  }}
                  onClick={() =>
                    setExpandedOrderId(isExpanded ? null : order.id)
                  }
                >
                  {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                </button>

                {/* Editar pedido */}
                <button
                  type="button"
                  className="btn primary"
                  style={{
                    padding: "8px 20px",
                    borderRadius: 999,
                    fontSize: 14,
                  }}
                  onClick={() => handleEditOrder(order.id)}
                  disabled={!puedeEditar}
                >
                  Editar pedido
                </button>
              </div>

              {/* ==== DETALLE PLEGABLE ==== */}
              {isExpanded && (
                <div className="table-wrap" style={{ marginTop: 8 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>A</th>
                        {sucursalesActivas >= 2 && <th>B</th>}
                        {sucursalesActivas >= 3 && <th>C</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={item.product.sku}>
                          <td>{index + 1}</td>
                          <td>{item.product.sku}</td>
                          <td>{item.product.desc}</td>
                          <td>{item.qtyA}</td>
                          {sucursalesActivas >= 2 && <td>{item.qtyB}</td>}
                          {sucursalesActivas >= 3 && <td>{item.qtyC}</td>}
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
                Solo puedes editar mientras el pedido esté{" "}
                <strong>Pendiente</strong>.
              </div>
            </div>
          );
        })}
      </div>
    </>
  );


  /* ================== Render root ================== */

  return (
    <div data-kolben="catalog">
      <header>
        <div className="container topbar">
          <div className="brand-wrap">
            <button className="brand-btn" id="homeLink" title="Inicio">
              <img
                id="logoImg"
                className="brand-img"
                alt="KOLBEN"
                src="/kolben-logo.png"
              />
            </button>

            <div id="logoEditWrap">
              <input
                type="file"
                id="logoFile"
                accept="image/*"
                style={{ display: "none" }}
              />
              <button id="logoEditBtn">Editar logo</button>
            </div>
          </div>

          <div className="right" id="sessionBox">
            {alias && (
              <span className="badge-user" title={alias}>
                {alias}
              </span>
            )}

            <button className="btn-ghost" onClick={handleLogout}>
              Salir
            </button>
          </div>

          <nav id="tabs">
            <button
              className={`tab ${activeTab === "catalog" ? "active" : ""}`}
              onClick={() => setActiveTab("catalog")}
            >
              Catálogo
            </button>
            <button
              className={`tab ${activeTab === "cart" ? "active" : ""}`}
              onClick={() => setActiveTab("cart")}
            >
              Carrito
            </button>
            <button
              className={`tab ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              Pedidos
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* OJO: aquí ya NO hay panel envolviendo pedidos.
            Así imitamos el layout del admin: 
            - Catálogo y Carrito dentro de panel
            - Pedidos igual que en admin (cards sueltas) */}
        <div className="container" style={{ paddingTop: 24 }}>
          {activeTab === "catalog" && (
            <div className="panel">{renderCatalogView()}</div>
          )}
      {activeTab === "cart" && (
        <div className="panel">{renderCartView()}</div>
      )}
      {activeTab === "orders" && renderOrdersView()}
    </div>
  </main>

  <div id="toast" className={`toast ${toastVisible ? "show" : ""}`}>
    {toastMessage}
  </div>
</div>
);
}

