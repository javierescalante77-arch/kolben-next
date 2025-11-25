"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

type Status = "disponible" | "bajo" | "agotado" | "reserva";

type TipoProducto =
  | "todo"
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch";

type Product = {
  id: string;
  sku: string;
  brand: string;
  desc: string;
  status: Status;
  eta?: string;
  type: TipoProducto;
  imgs: string[];
};

type ChipKey =
  | "todo"
  | "favoritos"
  | "maestro_frenos"
  | "maestro_clutch"
  | "auxiliar_frenos"
  | "auxiliar_clutch";

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: "todo", label: "Todo" },
  { key: "favoritos", label: "⭐ Favoritos" },
  { key: "maestro_frenos", label: "Maestro de frenos" },
  { key: "maestro_clutch", label: "Maestro de clutch" },
  { key: "auxiliar_frenos", label: "Auxiliar de frenos" },
  { key: "auxiliar_clutch", label: "Auxiliar de clutch" },
];

function pillFor(status: Status, eta?: string) {
  switch (status) {
    case "disponible":
      return <span className="pill ok">Disponible</span>;
    case "bajo":
      return <span className="pill low">Bajo stock</span>;
    case "agotado":
      return <span className="pill bad">Agotado</span>;
    case "reserva":
      return <span className="pill res">Llegando</span>;
    default:
      return null;
  }
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  const [favorite, setFavorite] = useState(false);

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

  const hasFotosExtra = product.imgs.length > 1;
  const isDisabled = product.status === "agotado";
  const buttonLabel =
    product.status === "reserva" ? "Reservar" : "Agregar";

  return (
    <div className="card">
      {/* Bloque de imagen + SKU igual a EONIK */}
      <div className="media-block">
        <div className="img-wrap">
          {product.imgs[0] ? (
            <Image
              src={product.imgs[0]}
              alt={product.desc}
              fill
              sizes="(max-width: 767px) 50vw, 25vw"
            />
          ) : (
            <Image
              src="/img/placeholder.png"
              alt={product.desc}
              fill
              sizes="(max-width: 767px) 50vw, 25vw"
            />
          )}

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
        {/* Marca + estrella en la misma fila */}
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

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    sku: "47201-04150",
    brand: "Toyota",
    desc: "Tacoma 05-15 Automático 15/16",
    status: "disponible",
    type: "maestro_frenos",
    imgs: ["/img/ejemplo1.png"],
  },
  {
    id: "2",
    sku: "47201-60460",
    brand: "Toyota",
    desc: "Cilindro maestro Corolla 3 tornillos 13/16",
    status: "reserva",
    eta: "15/12/2025",
    type: "maestro_frenos",
    imgs: ["/img/ejemplo2.png"],
  },
];

export default function CatalogoAdminPage() {
  const [chip, setChip] = useState<ChipKey>("todo");
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    let filtered = MOCK_PRODUCTS;

    if (chip !== "todo") {
      if (chip === "favoritos") {
        filtered = filtered.filter((p) => {
          const stored = localStorage.getItem("fav_" + p.id);
          return stored === "1";
        });
      } else {
        filtered = filtered.filter((p) => p.type === chip);
      }
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [chip, query]);

  const handleAdd = (p: Product) => {
    // Aquí irá la lógica real de agregar al carrito del admin
    // Por ahora lo dejamos vacío.
  };

  return (
    <main>
      <section className="panel">
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

        <div data-kolben>
          <div className="grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={handleAdd} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
