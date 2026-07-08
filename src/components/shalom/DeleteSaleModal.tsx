import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Modal } from "./Modal";
import { supabase, type Venta } from "@/lib/supabase";

export function DeleteSaleModal({
  open,
  onClose,
  venta,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  venta: Venta | null;
  onDeleted: () => void;
}) {
  const [saving, setSaving] = useState(false);

  if (!venta) return null;

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const clienteId = venta!.cliente_id;
      // Eliminar registros dependientes primero (FK)
      const { error: e1 } = await supabase.from("historial_pagos").delete().eq("venta_id", venta!.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("pagos").delete().eq("venta_id", venta!.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("ventas").delete().eq("id", venta!.id);
      if (e3) throw e3;

      // Si el cliente no tiene más ventas, eliminarlo también
      if (clienteId) {
        const { count } = await supabase
          .from("ventas")
          .select("id", { count: "exact", head: true })
          .eq("cliente_id", clienteId);
        if ((count ?? 0) === 0) {
          await supabase.from("clientes").delete().eq("id", clienteId);
        }
      }
      toast.success("Venta eliminada");
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="⚠️ ELIMINAR VENTA" titleClassName="text-destructive">
      <form onSubmit={confirm} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 text-destructive" size={20} />
          <p className="text-sm text-foreground">
            ¿Está seguro de eliminar la venta de <b>{venta.clientes?.nombre_completo}</b>? Esta acción no se puede deshacer.
          </p>
        </div>
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
            className="inline-flex items-center gap-1 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:brightness-90 disabled:opacity-60"
          >
            <Trash2 size={16} /> {saving ? "Eliminando..." : "Eliminar Permanentemente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}