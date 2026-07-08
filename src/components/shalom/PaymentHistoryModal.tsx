import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { supabase, type Venta } from "@/lib/supabase";
import { formatMoney, methodLabel, formatDate, formatTime12 } from "@/lib/format";
import { parseObservacion } from "@/lib/paymentExtra";

interface Row {
  id?: string;
  fecha_pago?: string;
  fecha?: string;
  hora_pago?: string | null;
  hora?: string | null;
  monto: number;
  metodo_pago?: string;
  metodo?: string;
  observacion?: string | null;
  observaciones?: string | null;
  registrado_por?: string | null;
  usuarios?: { username?: string; nombre?: string | null } | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): boolean {
  return Boolean(value && UUID_RE.test(value));
}

export function PaymentHistoryModal({
  open,
  onClose,
  venta,
}: {
  open: boolean;
  onClose: () => void;
  venta: Venta | null;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, { username?: string; nombre?: string | null }>>({});

  useEffect(() => {
    if (!open || !venta) return;
    setLoading(true);
    (async () => {
      let list: Row[] = [];
      const { data: pagos } = await supabase
        .from("pagos")
        .select("*, usuarios:registrado_por(username, nombre)")
        .eq("venta_id", venta.id)
        .order("fecha_pago", { ascending: false })
        .order("hora_pago", { ascending: false });

      if (pagos && pagos.length > 0) {
        list = pagos as unknown as Row[];
      } else {
        const rpc = await supabase.rpc("obtener_historial_venta_v2", {
          p_venta_id: venta.id,
        });
        if (!rpc.error && Array.isArray(rpc.data)) {
          list = rpc.data as Row[];
        }
      }
      // Enriquecer nombres de usuarios registrados si faltan
      const missingIds = Array.from(
        new Set(
          [venta.creado_por, ...list.map((r) => r.registrado_por)].filter(isUuid) as string[],
        ),
      );
      if (missingIds.length > 0) {
        const { data: us } = await supabase
          .from("usuarios")
          .select("id, username, nombre")
          .in("id", missingIds);
        const map: Record<string, { username?: string; nombre?: string | null }> = {};
        (us ?? []).forEach((u: { id: string; username: string; nombre: string | null }) => {
          map[u.id] = { username: u.username, nombre: u.nombre };
        });
        setUserMap(map);
      } else {
        setUserMap({});
      }
      setRows(list);
      setLoading(false);
    })();
  }, [open, venta]);

  return (
    <Modal open={open} onClose={onClose} title="📋 HISTORIAL DE PAGOS" size="lg">
      {venta && (
        <div className="mb-3 rounded-lg bg-muted p-3 text-sm">
          <span className="font-semibold text-primary">{venta.clientes?.nombre_completo}</span>{" "}
          — Monto total: <b>{formatMoney(venta.monto_total)}</b>
        </div>
      )}
      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sin pagos registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Hora</th>
                <th className="px-3 py-2 text-right">Monto</th>
                <th className="px-3 py-2 text-left">Método</th>
                <th className="px-3 py-2 text-left">Observación</th>
                <th className="px-3 py-2 text-left">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const fecha = r.fecha_pago ?? r.fecha ?? "";
                const hora = (r.hora_pago ?? r.hora ?? "") || "";
                const metodo = r.metodo_pago ?? r.metodo ?? "";
                const obs = r.observacion ?? r.observaciones ?? null;
                const parsed = parseObservacion(obs);
                const fallbackUser = r.registrado_por ? userMap[r.registrado_por] : undefined;
                const fallbackVentaUser = venta?.creado_por ? userMap[venta.creado_por] : undefined;
                const registeredNameFromRpc = !isUuid(r.registrado_por) ? r.registrado_por?.trim() : "";
                const nombreRegistrado =
                  r.usuarios?.nombre ||
                  r.usuarios?.username ||
                  fallbackUser?.nombre ||
                  fallbackUser?.username ||
                  registeredNameFromRpc ||
                  fallbackVentaUser?.nombre ||
                  fallbackVentaUser?.username ||
                  "—";
                return (
                  <tr key={r.id ?? i} className="border-t border-border hover:bg-muted/50">
                    <td className="px-3 py-2">{fecha ? formatDate(fecha) : "—"}</td>
                    <td className="px-3 py-2">{hora ? formatTime12(hora) : "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatMoney(r.monto)}</td>
                    <td className="px-3 py-2">{metodo ? methodLabel(metodo) : "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {parsed.label && parsed.value ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex w-fit items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                            <span>{parsed.label}:</span>
                            <span className="tracking-wide">{parsed.value}</span>
                          </span>
                          {parsed.userText && <span className="text-xs">{parsed.userText}</span>}
                        </div>
                      ) : parsed.userText ? (
                        parsed.userText
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">{nombreRegistrado}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}