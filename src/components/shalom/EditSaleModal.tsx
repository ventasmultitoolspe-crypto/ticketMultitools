import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { Modal } from "./Modal";
import { TextField, TextareaField } from "./Field";
import { supabase, type Venta } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface Props {
  open: boolean;
  onClose: () => void;
  venta: Venta | null;
  onUpdated: () => void;
}

export function EditSaleModal({ open, onClose, venta, onUpdated }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const [form, setForm] = useState({
    cliente: "",
    dni: "",
    telefono: "",
    monto_total: "",
    clave: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!venta) return;
    setForm({
      cliente: venta.clientes?.nombre_completo ?? "",
      dni: venta.clientes?.dni ?? "",
      telefono: venta.clientes?.telefono ?? "",
      monto_total: String(venta.monto_total),
      clave: venta.clave_acceso ?? "",
      observaciones: venta.observaciones ?? "",
    });
  }, [venta, open]);

  if (!venta) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const monto = parseFloat(form.monto_total);
    if (!(monto > 0)) return toast.error("Monto inválido");

    setSaving(true);
    try {
      await supabase
        .from("clientes")
        .update({
          nombre_completo: form.cliente,
          dni: form.dni,
          telefono: form.telefono,
        })
        .eq("id", venta!.cliente_id);

      const { error } = await supabase
        .from("ventas")
        .update({
          monto_total: monto,
          observaciones: form.observaciones || null,
          ...(isAdmin && form.clave.trim().length >= 4
            ? { clave_acceso: form.clave.trim() }
            : {}),
        })
        .eq("id", venta!.id);
      if (error) throw error;

      toast.success("Venta actualizada");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="✏️ EDITAR VENTA" titleClassName="text-secondary-dark" size="lg">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Cliente" required value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
          <TextField label="DNI/CE" required value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
          <TextField label="Teléfono" required value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <TextField
            label="Monto Total"
            required
            type="number"
            step="0.01"
            accent="secondary"
            value={form.monto_total}
            onChange={(e) => setForm({ ...form, monto_total: e.target.value })}
          />
          {isAdmin && (
            <TextField
              label="Clave de Envío"
              value={form.clave}
              onChange={(e) => setForm({ ...form, clave: e.target.value })}
              placeholder="Mínimo 4 caracteres"
            />
          )}
          <div className="sm:col-span-2">
            <TextareaField
              label="Observaciones"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
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
              <Save size={16} /> {saving ? "Guardando..." : "Actualizar Venta"}
            </button>
          </div>
        </form>
    </Modal>
  );
}