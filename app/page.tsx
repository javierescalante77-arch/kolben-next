"use client";

import Link from "next/link";
import "./globals.css";

/**
 * Página de inicio / landing muy simple para ambiente de desarrollo.
 * Desde aquí puedes entrar como:
 *  - Administrador → /admin/catalogo
 *  - Cliente demo → /cliente
 *
 * En producción, esta pantalla se sustituirá por el login real.
 */
export default function HomePage() {
  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="landing-logo-wrap">
          <img
            src="/kolben-logo.png"
            alt="Kolben Auto Repuestos"
            className="landing-logo"
          />
          <div className="landing-title-block">
            <h1 className="landing-title">KOLBEN · Panel de pedidos</h1>
            <p className="landing-subtitle">
              Versión Next · Entorno de desarrollo
            </p>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-card">
          <h2 className="landing-section-title">Accesos rápidos</h2>

          <div className="landing-grid">
            {/* Bloque ADMIN */}
            <div className="landing-box">
              <h3>Administrador</h3>
              <p>
                Entra al entorno de administrador para gestionar catálogo,
                pedidos, productos y clientes.
              </p>
              <ul className="landing-list">
                <li>
                  <span className="bullet">•</span> Catálogo admin: ver
                  productos y probar favoritos
                </li>
                <li>
                  <span className="bullet">•</span> Carrito admin: vista espejo
                  para pruebas de flujo
                </li>
                <li>
                  <span className="bullet">•</span> Pedidos admin: revisar
                  tarjetas, estados y detalle
                </li>
                <li>
                  <span className="bullet">•</span> Productos: mantenimiento de
                  catálogo
                </li>
                <li>
                  <span className="bullet">•</span> Clientes: alias, sucursales
                  activas, etc.
                </li>
              </ul>

              <div className="landing-actions">
                <Link href="/admin/catalogo" className="landing-btn primary">
                  Entrar como Admin
                </Link>
              </div>
            </div>

            {/* Bloque CLIENTE */}
            <div className="landing-box">
              <h3>Cliente (demo)</h3>
              <p>
                Simula la experiencia del cliente final: catálogo, carrito y
                pedidos.
              </p>
              <ul className="landing-list">
                <li>
                  <span className="bullet">•</span> Catálogo cliente: 2
                  productos por fila, chips, favoritos
                </li>
                <li>
                  <span className="bullet">•</span> Carrito cliente: cantidades
                  por sucursal
                </li>
                <li>
                  <span className="bullet">•</span> Pedidos cliente: historial
                  básico
                </li>
              </ul>

              <div className="landing-actions">
                <Link href="/cliente" className="landing-btn secondary">
                  Entrar como Cliente demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Nota de desarrollo */}
        <section className="landing-note">
          <h2>Notas de desarrollo</h2>
          <p>
            Esta pantalla es solo de apoyo mientras terminamos de migrar el
            diseño EONIK al stack Next/React/Prisma. En producción:
          </p>
          <ul className="landing-list">
            <li>
              <span className="bullet">•</span> <strong>/</strong> será la
              página de login real.
            </li>
            <li>
              <span className="bullet">•</span> Se aplicará autenticación
              (NextAuth/Auth.js) con roles Admin / Cliente.
            </li>
            <li>
              <span className="bullet">•</span> Los accesos se mostrarán según
              el rol del usuario.
            </li>
          </ul>
        </section>
      </main>

      <footer className="landing-footer">
        <span>Kolben Auto Repuestos · entorno de pruebas</span>
      </footer>
    </div>
  );
}
