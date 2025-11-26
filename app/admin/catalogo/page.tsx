"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ================== Tipos ================== */

type ProductStatus = "disponible" | "bajo" | "agotado" | "reserva";

type ProductType =
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch"
  | "pastillas_freno";

type ChipKey =
  | "todo"
  | "favoritos"
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
  type: ProductType;
  imgs: string[];
  eta?: string | null;
};

/* ================== Config chips ================== */

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
      // Si viene ETA, la usamos; si no, solo "Llegando"
      const label = eta && eta.trim() ? `Llegando · ${eta}` : "Llegando";
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
    const stored = localStorage.getItem("fav_" + product.id);
    setFavorite(stored === "1");
  }, [product.id]);

  const toggleFavorite = () => {
    const next = !favorite;
    setFavorite(next);
    if (next) localStorage.setItem("fav_" + product.id, "1");
    else localStorage.removeItem("fav_" + product.id);
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
      {/* Bloque de imagen + SKU igual a EONIK */}
      <div className="media-block">
        <div className="img-wrap">
          <Image
            src={mainImg}
            alt={product.desc}
            fill
            sizes="(max-width: 767px) 50vw, 25vw"
          />

          {hasFotosExtra && (
            <span className="photos-chip">
              {product.imgs.length} fotos
            </span>
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
          {pillFor(product.status, product.eta ?? undefined)}

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

/* ================== Página Catálogo (admin) ================== */

export default function CatalogoAdminPage() {
  // Estado de filtros
  const [chip, setChip] = useState<ChipKey>("todo");
  const [query, setQuery] = useState("");

  // Estado de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar productos desde la API REAL
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch("/api/productos/list");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();

        if (!json.ok || !Array.isArray(json.data)) {
          throw new Error("Respuesta inesperada de la API");
        }

        // Aseguramos estructura mínima
        const mapped: Product[] = json.data.map((p: any) => ({
          id: String(p.id),
          sku: p.sku ?? "",
          brand: p.brand ?? "",
          desc: p.desc ?? "",
          status: p.status as ProductStatus,
          type: p.type as ProductType,
          imgs: Array.isArray(p.imgs) ? p.imgs : [],
          eta: p.eta ?? null,
        }));

        setProducts(mapped);
      } catch (err: any) {
        console.error("Error cargando productos:", err);
        setErrorMsg("No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Filtro en memoria (chip + buscador)
  const filteredProducts = useMemo(() => {
    let result = products;

    if (chip !== "todo") {
      if (chip === "favoritos") {
        result = result.filter((p) => {
          const stored = localStorage.getItem("fav_" + p.id);
          return stored === "1";
        });
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

  // Placeholder: luego aquí conectamos al carrito real
  const handleAdd = (p: Product) => {
    console.log("Agregar al carrito (aún demo):", p.sku);
  };

  return (
    <main>
      <section className="panel">
        {/* Header simple con link de regreso al admin si lo necesitas */}
        <div className="row" style={{ marginBottom: 16 }}>
          <Link href="/admin" className="btn light">
            ← Volver al panel
          </Link>
        </div>

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
          <div style={{ padding: "1rem 0" }}>Cargando productos…</div>
        )}

        {errorMsg && !loading && (
          <div style={{ padding: "1rem 0", color: "#b91c1c" }}>{errorMsg}</div>
        )}

        {!loading && !errorMsg && filteredProducts.length === 0 && (
          <div style={{ padding: "1rem 0" }}>
            No hay productos que coincidan con el filtro.
          </div>
        )}

        {/* Grid Kolben (igual estructura que antes) */}
        <div data-kolben>
          <div className="grid">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={handleAdd} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
