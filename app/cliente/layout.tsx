"use client";

import React from "react";
import Link from "next/link";
import "./cliente.css";

type ClienteLayoutProps = {
  children: React.ReactNode;
};

export default function ClienteLayout({ children }: ClienteLayoutProps) {
  return (
    <div data-kolben="cliente">
      {/* ============ HEADER KOLBEN CLIENTE ============ */}
      <header>
        <div className="container">
          <div className="topbar">
            {/* Logo */}
            <div className="brand-wrap">
              <button
                className="brand-btn"
                id="homeLinkCliente"
                title="Inicio cliente"
                type="button"
              >
                <img
                  id="logoImgCliente"
                  className="brand-img"
                  alt="Kolben Auto Repuestos"
                  src="/kolben-logo.png"
                />
              </button>
            </div>

            {/* Chip + botón Salir */}
            <div className="right" id="sessionBoxCliente">
              <span className="badge-user">Cliente demo</span>
              <Link href="/login" className="btn-ghost">
                Salir
              </Link>
            </div>

            {/* 🟢 IMPORTANTE:
                Aquí ANTES había <nav id="tabs"> con "Catálogo".
                Lo eliminamos para no duplicar las tabs que ya están
                dentro de /cliente/page.tsx.
             */}
          </div>
        </div>
      </header>

      {/* Contenido de /cliente/page.tsx (catálogo, carrito, pedidos) */}
      <main>{children}</main>
    </div>
  );
}

