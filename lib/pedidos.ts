// lib/pedidos.ts

export async function crearPedido(data: any) {
  const res = await fetch("/api/pedidos/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function listarPedidos() {
  const res = await fetch("/api/pedidos/list", {
    method: "GET",
  });
  return res.json();
}

export async function cambiarEstadoPedido(id: string, estado: string) {
  const res = await fetch("/api/pedidos/updateEstado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado }),
  });
  return res.json();
}

export async function eliminarPedido(id: string) {
  const res = await fetch("/api/pedidos/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return res.json();
}
