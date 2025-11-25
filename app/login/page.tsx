"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!usuario.trim() || !contrasena.trim()) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    // 🔐 Lógica provisional:
    // - admin / 1234 -> /admin
    // - cualquier otro usuario válido -> /cliente
    if (usuario === "admin" && contrasena === "1234") {
      router.push("/admin");
    } else {
      router.push("/cliente");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-md border border-[#E5E7EB] px-8 py-10">
          {/* Logo real Kolben ARRIBA */}
          <div className="flex justify-center mb-4">
            <Image
              src="/kolben-logo.png"
              alt="Kolben Auto Repuestos"
              width={260}
              height={120}
              className="h-auto w-auto max-w-full"
              priority
            />
          </div>

          {/* Texto de acceso DEBAJO del logo */}
          <p className="text-center text-sm font-semibold text-[#111827] mb-4">
            Acceso exclusivo para socios comerciales de Kolben
          </p>

          {error && (
            <p className="text-center text-xs text-red-600 mb-3">{error}</p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <input
                type="text"
                placeholder="Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#111827] focus:border-[#111827] placeholder:text-[#9CA3AF]"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#111827] focus:border-[#111827] placeholder:text-[#9CA3AF]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-[#6B7280]">
          Kolben Auto Repuestos · Marca Registrada
        </div>
      </div>
    </div>
  );
}
