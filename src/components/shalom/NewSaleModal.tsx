import { useState } from "react";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { Modal } from "./Modal";
import { TextField, TextareaField, SelectField } from "./Field";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS, todayLocalISO, nowLocalTime } from "@/lib/format";
import { PaymentExtraField } from "./PaymentExtraField";
import { requiresExtra, validateExtra, buildObservacion, checkDuplicatePago } from "@/lib/paymentExtra";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (
    cliente?: { nombre: string; dni: string; telefono: string },
    venta?: { id: string; fecha_venta: string },
  ) => void;
}

const empty = {
  cliente: "",
  dni: "",
  telefono: "",
  monto_total: "",
  monto_inicial: "",
  metodo_inicial: "",
  extra_inicial: "",
  clave: "",
  observaciones: "",
};

export function NewSaleModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const monto = parseFloat(form.monto_total);
    const adelanto = parseFloat(form.monto_inicial);

    if (!form.cliente.trim()) return toast.error("El nombre del cliente es obligatorio");
    if (!form.dni.trim()) return toast.error("El DNI/CE es obligatorio");
    if (!form.telefono.trim()) return toast.error("El teléfono es obligatorio");
    if (!(monto > 0)) return toast.error("El monto total debe ser mayor a 0");
    if (!(adelanto > 0)) return toast.error("El monto inicial (adelanto) es obligatorio");
    if (adelanto > monto) return toast.error("El adelanto no puede superar el monto total");
    if (!form.metodo_inicial) return toast.error("Seleccione el método de pago del adelanto");
    if (requiresExtra(form.metodo_inicial)) {
      const err = validateExtra(form.metodo_inicial, form.extra_inicial);
      if (err) return toast.error(err);
    }
    if (form.clave.length < 4) return toast.error("La clave debe tener al menos 4 caracteres");

    setSaving(true);
    try {
      // Verificar pago posiblemente duplicado (mismo método + monto + referencia)
      if (requiresExtra(form.metodo_inicial)) {
        const dup = await checkDuplicatePago({
          metodo: form.metodo_inicial,
          monto: adelanto,
          raw: form.extra_inicial,
        });
        if (dup) {
          const ok = window.confirm(
            "⚠️ Posible pago DUPLICADO: ya existe un pago con el mismo método, monto y referencia. ¿Desea continuar con la venta?",
          );
          if (!ok) {
            setSaving(false);
            return;
          }
        }
      }
      const { data: existente } = await supabase
        .from("clientes")
        .select("id")
        .eq("dni", form.dni.trim())
        .maybeSingle();

      let clienteId = existente?.id as string | undefined;
      if (!clienteId) {
        const { data: nuevo, error: e1 } = await supabase
          .from("clientes")
          .insert({
            nombre_completo: form.cliente.trim(),
            dni: form.dni.trim(),
            telefono: form.telefono.trim(),
          })
          .select("id")
          .single();
        if (e1) throw e1;
        clienteId = nuevo.id;
      } else {
        await supabase
          .from("clientes")
          .update({
            nombre_completo: form.cliente.trim(),
            telefono: form.telefono.trim(),
          })
          .eq("id", clienteId);
      }

      const fechaVenta = todayLocalISO();
      const horaVenta = nowLocalTime();

      const estadoInicial = adelanto >= monto ? "pagado" : "pendiente";
      const { data: ventaCreada, error: e2 } = await supabase.from("ventas").insert({
        cliente_id: clienteId,
        monto_total: monto,
        fecha_venta: fechaVenta,
        hora_venta: horaVenta,
        fecha_limite_pago: fechaVenta,
        clave_acceso: form.clave,
        observaciones: form.observaciones || null,
        estado: estadoInicial,
        creado_por: user?.id ?? null,
      }).select("id").single();
      if (e2) throw e2;

      // Registrar el pago inicial (adelanto)
      const observacionPago = buildObservacion(form.metodo_inicial, form.extra_inicial, "Adelanto inicial");
      const { error: e3 } = await supabase.from("pagos").insert({
        venta_id: ventaCreada.id,
        monto: adelanto,
        metodo_pago: form.metodo_inicial,
        fecha_pago: fechaVenta,
        hora_pago: horaVenta,
        observacion: observacionPago,
        registrado_por: user?.id ?? null,
      });
      if (e3) throw e3;

      toast.success("Venta registrada correctamente");
      const clienteInfo = {
        nombre: form.cliente.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono.trim(),
      };
      setForm({ ...empty });
      onCreated(clienteInfo, { id: ventaCreada.id, fecha_venta: fechaVenta });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="📝 REGISTRAR NUEVA VENTA" size="lg">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Cliente" required value={form.cliente} onChange={(e) => update("cliente", e.target.value)} />
        <TextField label="DNI/CE" required value={form.dni} onChange={(e) => update("dni", e.target.value)} />
        <TextField label="Teléfono" required value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
        <TextField
          label="Monto Total (S/)"
          required
          type="number"
          step="0.01"
          min="0"
          accent="secondary"
          value={form.monto_total}
          onChange={(e) => update("monto_total", e.target.value)}
        />
        <TextField
          label="Monto Inicial / Adelanto (S/)"
          required
          type="number"
          step="0.01"
          min="0"
          accent="secondary"
          value={form.monto_inicial}
          onChange={(e) => update("monto_inicial", e.target.value)}
        />
        <SelectField
          label="Método de Pago del Adelanto"
          required
          value={form.metodo_inicial}
          onChange={(e) => {
            update("metodo_inicial", e.target.value);
            update("extra_inicial", "");
          }}
        >
          <option value="">-- Seleccionar --</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_ICONS[m]} {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </SelectField>
        {requiresExtra(form.metodo_inicial) && (
          <PaymentExtraField
            metodo={form.metodo_inicial}
            value={form.extra_inicial}
            onChange={(raw) => update("extra_inicial", raw)}
          />
        )}
        <TextField
          label="Clave de Envío"
          required
          value={form.clave}
          onChange={(e) => update("clave", e.target.value)}
          placeholder="Mínimo 4 caracteres"
        />
        <div className="sm:col-span-2">
          <TextareaField
            label="Observaciones"
            value={form.observaciones}
            onChange={(e) => update("observaciones", e.target.value)}
          />
        </div>
        <p className="sm:col-span-2 text-xs text-muted-foreground">
          Los pagos se registran después desde el botón <b>Cobrar</b>. Puedes agregar tantos pagos como necesites.
        </p>

        <div className="sm:col-span-2 mt-2 flex flex-wrap justify-end gap-2">
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
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-secondary-glow transition hover:bg-secondary-dark disabled:opacity-60"
          >
            <Save size={16} /> {saving ? "Guardando..." : "Guardar Venta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}