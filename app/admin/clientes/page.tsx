"use client";

import { useState } from "react";
import "../../cliente/cliente.css";

/* ============================
   Modelo temporal (demo)
   ============================ */

type SucursalesActivas = 1 | 2 | 3;

type Cliente = {
  id: number;
  nombre: string;       // "Cliente" – nombre completo para chips / PDF
  usuario: string;      // Login
  alias: string;        // Alias para chip en catálogo móvil
  password: string;     // Clave de login
  sucursales: SucursalesActivas; // 1, 2 o 3 sucursales activas
};

/* Cliente administrador */
const adminData = {
  nombre: "Administrador",
  alias: "Administrador",
  password: "",
  sucursales: 1 as SucursalesActivas, // Admin siempre 1 sucursal (A)
};

/* Lista demo de clientes */
const initialClientes: Cliente[] = [
  {
    id: 1,
    nombre: "Repuestos Don Julio",
    usuario: "donjulio",
    alias: "Don Julio",
    password: "",
    sucursales: 3,
  },
  {
    id: 2,
    nombre: "AutoCentro Eléctrico",
    usuario: "autocentro",
    alias: "AutoCentro",
    password: "",
    sucursales: 2,
  },
  {
    id: 3,
    nombre: "Repuestos La 15",
    usuario: "la15",
    alias: "La 15",
    password: "",
    sucursales: 1,
  },
];

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [admin, setAdmin] = useState(adminData);

  /* ============================
        Funciones
     ============================ */

  const updateAdmin = () => {
    alert("Contraseña del administrador actualizada (demo).");
  };

  const addCliente = () => {
    const nuevo: Cliente = {
      id: clientes.length + 1,
      nombre: "",
      usuario: "",
      alias: "",
      password: "",
      sucursales: 1,
    };
    setClientes((prev) => [...prev, nuevo]);
  };

  const updateCliente = (
    id: number,
    campo: keyof Cliente,
    valor: string | number
  ) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, [campo]: valor } : c
      )
    );
  };

  const deleteCliente = (id: number) => {
    if (confirm("¿Eliminar este cliente?")) {
      setClientes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const saveCliente = (id: number) => {
    const c = clientes.find((x) => x.id === id);
    // Más adelante se conectará a la API / base de datos
    // eslint-disable-next-line no-console
    console.log("Guardar cliente (demo):", c);
    alert("Cliente guardado (demo).");
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ marginBottom: 10 }}>Clientes</h1>

      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Configura aquí los clientes que usarán la web de pedidos Kolben.
        Las <b>sucursales activas (A / B / C)</b> controlan cuántas columnas de
        cantidad se mostrarán en el carrito y en los pedidos.
      </p>

      {/* ======================================
            BLOQUE ADMINISTRADOR
         ====================================== */}
      <div
        className="panel admin-clients-panel"
        style={{ marginBottom: 34 }}
      >
        <h3
          className="admin-clients-title"
          style={{ marginBottom: 12 }}
        >
          Administrador
        </h3>

        <div
          className="admin-clients-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 120px",
            gap: 16,
            alignItems: "center",
          }}
        >
          <input
            className="input admin-clients-input"
            type="text"
            value={admin.nombre}
            readOnly
          />

          <input
            className="input admin-clients-input"
            type="password"
            placeholder="Nueva contraseña"
            value={admin.password}
            onChange={(e) =>
              setAdmin({ ...admin, password: e.target.value })
            }
          />

          <button
            className="btn dark admin-clients-btn"
            type="button"
            onClick={updateAdmin}
          >
            Guardar
          </button>
        </div>
      </div>

      {/* ======================================
            LISTA DE CLIENTES
         ====================================== */}
      <div className="panel">
        <button
          className="btn dark"
          style={{ marginBottom: 20 }}
          onClick={addCliente}
          type="button"
        >
          + Nuevo cliente
        </button>

        {/* --- Vista ESCRITORIO: tabla clásica --- */}
        <div className="desktop-only">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Usuario</th>
                <th>Alias</th>
                <th>Clave</th>
                <th>Sucursales activas</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>

                  {/* Cliente (nombre completo) */}
                  <td>
                    <input
                      className="input"
                      value={c.nombre}
                      onChange={(e) =>
                        updateCliente(c.id, "nombre", e.target.value)
                      }
                    />
                  </td>

                  {/* Usuario (login) */}
                  <td>
                    <input
                      className="input"
                      value={c.usuario}
                      onChange={(e) =>
                        updateCliente(c.id, "usuario", e.target.value)
                      }
                    />
                  </td>

                  {/* Alias (chip en catálogo móvil) */}
                  <td>
                    <input
                      className="input"
                      value={c.alias}
                      onChange={(e) =>
                        updateCliente(c.id, "alias", e.target.value)
                      }
                    />
                  </td>

                  {/* Clave */}
                  <td>
                    <input
                      className="input"
                      type="password"
                      value={c.password}
                      onChange={(e) =>
                        updateCliente(c.id, "password", e.target.value)
                      }
                    />
                  </td>

                  {/* Sucursales activas */}
                  <td>
                    <select
                      className="input"
                      value={c.sucursales}
                      onChange={(e) =>
                        updateCliente(
                          c.id,
                          "sucursales",
                          Number(e.target.value) as SucursalesActivas
                        )
                      }
                    >
                      <option value={1}>Solo A</option>
                      <option value={2}>A + B</option>
                      <option value={3}>A + B + C</option>
                    </select>
                  </td>

                  {/* Acción: Eliminar + Guardar */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        className="btn-ghost"
                        type="button"
                        onClick={() => deleteCliente(c.id)}
                      >
                        Eliminar
                      </button>
                      <button
                        className="btn primary"
                        type="button"
                        onClick={() => saveCliente(c.id)}
                      >
                        Guardar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Vista MÓVIL: tarjetas tipo ficha --- */}
        <div className="mobile-only">
          <div className="clients-cards">
            {clientes.map((c) => (
              <div className="client-card" key={c.id}>
                <div className="client-field">
                  <span className="client-field-label">Cliente</span>
                  <input
                    className="input"
                    value={c.nombre}
                    onChange={(e) =>
                      updateCliente(c.id, "nombre", e.target.value)
                    }
                  />
                </div>

                <div className="client-field">
                  <span className="client-field-label">Usuario</span>
                  <input
                    className="input"
                    value={c.usuario}
                    onChange={(e) =>
                      updateCliente(c.id, "usuario", e.target.value)
                    }
                  />
                </div>

                <div className="client-field">
                  <span className="client-field-label">Alias</span>
                  <input
                    className="input"
                    value={c.alias}
                    onChange={(e) =>
                      updateCliente(c.id, "alias", e.target.value)
                    }
                  />
                </div>

                <div className="client-field">
                  <span className="client-field-label">Contraseña</span>
                  <input
                    className="input"
                    type="password"
                    value={c.password}
                    onChange={(e) =>
                      updateCliente(c.id, "password", e.target.value)
                    }
                  />
                </div>

                <div className="client-field">
                  <span className="client-field-label">
                    Sucursales activas
                  </span>
                  <select
                    className="input"
                    value={c.sucursales}
                    onChange={(e) =>
                      updateCliente(
                        c.id,
                        "sucursales",
                        Number(e.target.value) as SucursalesActivas
                      )
                    }
                  >
                    <option value={1}>Solo A</option>
                    <option value={2}>A + B</option>
                    <option value={3}>A + B + C</option>
                  </select>
                </div>

                <div className="client-footer">
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() => deleteCliente(c.id)}
                  >
                    Eliminar
                  </button>
                  <button
                    className="btn primary"
                    type="button"
                    onClick={() => saveCliente(c.id)}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ marginTop: 14, color: "#6b7280", fontSize: 12 }}>
          * Estos datos se guardarán en la base de datos en la siguiente fase
          del proyecto.
        </p>
      </div>
    </div>
  );
}
