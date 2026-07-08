import type { EstadoVenta } from "@/lib/supabase";

export function EstadoBadge({ estado }: { estado: EstadoVenta }) {
  if (estado === "pagado")
    return <span className="badge-pagado">✅ Pagado</span>;
  // "vencido" se muestra como Pendiente en la columna Estado;
  // el aviso ❌ Vencido va debajo de la Fecha Límite.
  return <span className="badge-pendiente">⏳ Pendiente</span>;
}