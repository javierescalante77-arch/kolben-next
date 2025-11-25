"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../cliente/cliente.css";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Resalta la pestaña según la ruta actual
    if (href === "/admin/catalogo") {
      return pathname === "/admin" || pathname === "/admin/catalogo";
    }
    return pathname?.startsWith(href);
  };

  const tabClass = (href: string) =>
    "tab" + (isActive(href) ? " active" : "");

  return (
    <div data-kolben="admin">
      {/* ============ HEADER EONIK (alineado al contenedor) ============ */}
      <header>
        {/* Contenedor central: MISMO ancho que el panel de tarjetas */}
        <div className="container">
          {/* Barra superior dentro del contenedor */}
          <div className="topbar">
            {/* Bloque logo + editar logo */}
            <div className="brand-wrap">
              <button
                className="brand-btn"
                id="homeLink"
                title="Inicio"
                type="button"
              >
                <img
                  id="logoImg"
                  className="brand-img"
                  alt="Kolben Auto Repuestos"
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
                <button id="logoEditBtn" type="button">
                  Editar logo
                </button>
              </div>
            </div>

            {/* Chip usuario + botón salir */}
            <div className="right" id="sessionBox">
              {/* Para admin siempre mostramos este chip.
                 Más adelante, para clientes, aquí entra alias/nombre. */}
              <span className="badge-user">Admin</span>

              <Link href="/login" className="btn-ghost">
                Salir
              </Link>
            </div>

            {/* Tabs principales (PC y móvil) */}
            <nav id="tabs">
              <Link
                href="/admin/catalogo"
                className={tabClass("/admin/catalogo")}
              >
                Catálogo
              </Link>
              <Link
                href="/admin/carrito"
                className={tabClass("/admin/carrito")}
              >
                Carrito
              </Link>
              <Link
                href="/admin/pedidos"
                className={tabClass("/admin/pedidos")}
              >
                Pedidos
              </Link>
              <Link
                href="/admin/productos"
                className={tabClass("/admin/productos")}
              >
                Productos
              </Link>
              <Link
                href="/admin/clientes"
                className={tabClass("/admin/clientes")}
              >
                Clientes
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ============ CONTENIDO PRINCIPAL ============ */}
      <main>
        {children}
      </main>
    </div>
  );
}
