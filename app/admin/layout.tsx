"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./admin.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const makeTabClass = (href: string) => {
    const isActive =
      pathname === href || pathname.startsWith(href + "/");
    return `admin-tab${isActive ? " admin-tab-active" : ""}`;
  };

  return (
    <div className="admin-layout">
      {/* ============================
          HEADER SUPERIOR ADMIN
      ============================= */}
      <header className="admin-header">
        {/* Logo Kolben */}
        <div className="admin-logo">
          <img src="/logo.png" alt="Kolben" />
        </div>

        {/* NAV PRINCIPAL */}
        <nav className="admin-nav">
          <Link href="/admin/catalogo" className={makeTabClass("/admin/catalogo")}>
            Catálogo
          </Link>

          <Link href="/admin/clientes" className={makeTabClass("/admin/clientes")}>
            Clientes
          </Link>

          <Link href="/admin/pedidos" className={makeTabClass("/admin/pedidos")}>
            Pedidos
          </Link>

          <Link href="/admin/productos" className={makeTabClass("/admin/productos")}>
            Productos
          </Link>
        </nav>

        {/* BOTÓN SALIR */}
        <div className="admin-exit">
          <Link href="/login" className="admin-exit-btn">
            Salir
          </Link>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="admin-panel">{children}</main>
    </div>
  );
}
