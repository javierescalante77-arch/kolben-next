"use client";

import { useEffect, useMemo, useState } from "react";
import "../cliente/cliente.css";

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
  qty: number;
};

type ChipKey =
  | "todo"
  | "favoritos"
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch"
  | "pastillas_freno";

/* ================== Datos demo ================== */

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
    desc: "Cilindro maestro Tiida 95–05 aluminio",
    status: "Bajo stock",
    imgs: ["/placeholder-3.png"],
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

  // Placeholder simple si no hay imagen
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
      {/* ====== BLOQUE SUPERIOR: IMAGEN ====== */}
      <div className="media-block">
        <div className="img-wrap">{firstImg(p)}</div>
      </div>

      {/* ====== BLOQUE INFERIOR ====== */}
      <div className="card-inner">
        {/* SKU debajo de la imagen */}
        <div className="sku-center">
          <div className="sku">{p.sku}</div>
        </div>

        {/* Marca (izquierda) + estrella favoritos (derecha) */}
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

        {/* Descripción */}
        <div className="desc">{p.desc}</div>

        {/* Pie: estado + botón Agregar / Reservar / Agotado */}
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

/* ================== Página Catálogo Admin ================== */

export default function AdminCatalogPage() {
  const [activeChip, setActiveChip] = useState<ChipKey>("todo");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toastVisible, setToastVisible] = useState(false);

  const [favorites, setFavorites] = useState<string[]>([]);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("kolben_favs");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch {
      // ignoramos errores
    }
  }, []);

  const persistFavorites = (next: string[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("kolben_favs", JSON.stringify(next));
    } catch {
      // ignorar
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

  /* ---- Filtro por texto + chip (incluye favoritos) ---- */
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return sampleProducts.filter((p) => {
      if (q) {
        const matchesText =
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      if (activeChip === "favoritos") {
        return favorites.includes(p.sku);
      }

      // el resto de chips se comportan como "Todo" por ahora
      return true;
    });
  }, [search, activeChip, favorites]);

  /* ---- Carrito demo ---- */
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.sku === product.sku);
      if (idx === -1) {
        return [...prev, { product, qty: 1 }];
      }
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
      return copy;
    });

    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1300);
  };

  return (
    <div className="container">
      <div className="panel">
        {/* Chips de categorías */}
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
            Maestro de frenos
          </button>
          <button
            className={`chip ${
              activeChip === "maestro_clutch" ? "active" : ""
            }`}
            onClick={() => setActiveChip("maestro_clutch")}
          >
            Maestro de clutch
          </button>
          <button
            className={`chip ${
              activeChip === "auxiliar_frenos" ? "active" : ""
            }`}
            onClick={() => setActiveChip("auxiliar_frenos")}
          >
            Auxiliar de freno
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
            Pastillas de freno
          </button>
        </div>

        {/* Buscador */}
        <div className="row">
          <input
            id="q"
            placeholder="Buscar por código, marca, modelo."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            id="clear"
            className="btn light"
            onClick={() => setSearch("")}
          >
            Limpiar
          </button>
        </div>

        {/* Grid de productos */}
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

        {/* Fila inferior: enlaces tipo “Ver carrito / Enviar pedido” */}
        <div
          className="row"
          style={{ justifyContent: "flex-end", marginTop: 16, gap: 8 }}
        >
          <button
            className="btn light"
            onClick={() => {
              console.log("Demo: ver carrito", cart);
            }}
          >
            Ver carrito
          </button>
          <button
            className="btn primary"
            onClick={() => {
              console.log("Demo: enviar pedido", cart);
            }}
          >
            Enviar pedido
          </button>
        </div>
      </div>

      {/* Toast visual */}
      <div id="toast" className={`toast ${toastVisible ? "show" : ""}`}>
        Agregado
      </div>
    </div>
  );
}
