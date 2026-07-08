import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, X } from "lucide-react";
import { Modal } from "./Modal";
import { TextField, SelectField, TextareaField } from "./Field";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS, formatMoney, todayLocalISO, nowLocalTime } from "@/lib/format";
import { supabase, type Venta } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PaymentExtraField } from "./PaymentExtraField";
import { requiresExtra, validateExtra, buildObservacion, checkDuplicatePago } from "@/lib/paymentExtra";

interface Props {
  open: boolean;
  onClose: () => void;
  venta: Venta | null;
  onCollected: () => void;
}

export function CollectPaymentModal({ open, onClose, venta, onCollected }: Props) {
  const { user } = useAuth();
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("");
  const [extra, setExtra] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  if (!venta) return null;
  const totalPagado = venta.total_pagado ?? 0;
  const pendiente = Math.max(venta.monto_total - totalPagado, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(monto);
    if (!(n > 0)) return toast.error("Monto inválido");
    if (n > pendiente + 0.001) return toast.error("El monto excede el saldo pendiente");
    if (!metodo) return toast.error("Seleccione un método de pago");
    if (requiresExtra(metodo)) {
      const err = validateExtra(metodo, extra);
      if (err) return toast.error(err);
    }

    setSaving(true);
    try {
      if (requiresExtra(metodo)) {
        const dup = await checkDuplicatePago({ metodo, monto: n, raw: extra });
        if (dup) {
          const ok = window.confirm(
            "⚠️ Posible pago DUPLICADO: ya existe un pago con el mismo método, monto y referencia. ¿Desea continuar con el cobro?",
          );
          if (!ok) {
            setSaving(false);
            return;
          }
        }
      }
      const observacionPago = buildObservacion(metodo, extra, obs);
      const fechaLocal = todayLocalISO();
      const horaLocal = nowLocalTime();
      // Preferir RPC v2, con fallback a INSERT directo
      const rpc = await supabase.rpc("cobrar_venta_v2", {
        p_venta_id: venta!.id,
        p_monto: n,
        p_metodo_pago: metodo,
        p_usuario_id: user?.id ?? null,
        p_observacion: observacionPago,
      });
      if (rpc.error) {
        const { error: e1 } = await supabase.from("pagos").insert({
          venta_id: venta!.id,
          monto: n,
          metodo_pago: metodo,
          fecha_pago: fechaLocal,
          hora_pago: horaLocal,
          observacion: observacionPago,
          registrado_por: user?.id ?? null,
        });
        if (e1) throw e1;
      } else {
        // El RPC guarda hora con now() (UTC). Sobrescribir con hora local del cliente.
        const { data: ultimo } = await supabase
          .from("pagos")
          .select("id")
          .eq("venta_id", venta!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (ultimo?.id) {
          await supabase
            .from("pagos")
            .update({ fecha_pago: fechaLocal, hora_pago: horaLocal })
            .eq("id", ultimo.id);
        }
      }
      // Siempre recalcular estado según pagos reales (cubre RPC v2 y fallback)
      if (totalPagado + n + 0.001 >= venta!.monto_total) {
        await supabase.from("ventas").update({ estado: "pagado" }).eq("id", venta!.id);
      } else {
        await supabase.from("ventas").update({ estado: "pendiente" }).eq("id", venta!.id);
      }
      toast.success("Cobro registrado");
      setMonto("");
      setMetodo("");
      setExtra("");
      setObs("");
      onCollected();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cobrar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="💰 COBRAR SALDO PENDIENTE" titleClassName="text-secondary-dark">
      <div className="mb-4 rounded-xl bg-muted p-4">
        <p className="text-sm text-muted-foreground">Cliente</p>
        <p className="font-semibold text-primary">{venta.clientes?.nombre_completo ?? "—"}</p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Monto Total</p>
            <p className="font-semibold">{formatMoney(venta.monto_total)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="font-semibold">{formatMoney(totalPagado)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
            <p className="text-lg font-extrabold text-secondary-dark">{formatMoney(pendiente)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <TextField
          label="Monto a Cobrar (S/)"
          required
          type="number"
          step="0.01"
          min="0"
          max={pendiente}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
        <SelectField
          label="Método de Pago"
          required
          value={metodo}
          onChange={(e) => {
            setMetodo(e.target.value);
            setExtra("");
          }}
        >
          <option value="">-- Seleccionar --</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_ICONS[m]} {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </SelectField>
        {requiresExtra(metodo) && (
          <PaymentExtraField metodo={metodo} value={extra} onChange={setExtra} />
        )}
        <TextareaField label="Observación" value={obs} onChange={(e) => setObs(e.target.value)} />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <X size={16} /> Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-primary-glow transition hover:bg-primary-dark disabled:opacity-60"
          >
            <CheckCircle2 size={16} /> {saving ? "Registrando..." : "Confirmar Cobro"}
          </button>
        </div>
      </form>
    </Modal>
  );
}