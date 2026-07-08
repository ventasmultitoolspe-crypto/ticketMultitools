import { useEffect, useMemo, useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import jsPDF from "jspdf";
import { Modal } from "./Modal";
import { TextField, TextareaField } from "./Field";
import { AGENCIES, type AgencyInfo } from "@/lib/agencies";
import { formatDate } from "@/lib/format";

interface ClienteInfo {
  nombre: string;
  dni: string;
  telefono: string;
  fechaVenta?: string;
  numeroOrden?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: ClienteInfo | null;
}

const REMITENTE = {
  nombre: "ALEXANDER VASQUEZ FERNANDEZ",
  dni: "74820073",
  telefono: "907008110",
};

export function ShippingLabelModal({ open, onClose, cliente }: Props) {
  const [destinatario, setDestinatario] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [agencia, setAgencia] = useState("");
  const [pedido, setPedido] = useState("");
  const [agenciaOpen, setAgenciaOpen] = useState(false);
  const agenciaRef = useRef<HTMLDivElement>(null);
  const numeroOrden = cliente?.numeroOrden ?? 0;
  const fechaVentaTxt = cliente?.fechaVenta ? formatDate(cliente.fechaVenta) : "";

  const agenciaSuggestions = useMemo<AgencyInfo[]>(() => {
    const q = agencia.trim().toLowerCase();
    if (!q) return AGENCIES.slice(0, 50);
    return AGENCIES.filter(
      (a) =>
        a.n.toLowerCase().includes(q) ||
        a.p.toLowerCase().includes(q) ||
        a.a.toLowerCase().includes(q),
    ).slice(0, 50);
  }, [agencia]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (agenciaRef.current && !agenciaRef.current.contains(e.target as Node)) {
        setAgenciaOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open && cliente) {
      setDestinatario(cliente.nombre ?? "");
      setDni(cliente.dni ?? "");
      setTelefono(cliente.telefono ?? "");
      setAgencia("");
      setPedido("");
    }
  }, [open, cliente]);

  function generarPDF() {
    // Formato más grande: 180mm x 110mm — horizontal
    const W = 180;
    const H = 110;
    const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "landscape" });
    const M = 7;
    let y = 10;

    // N° de orden (izquierda) — Título (centro) — Fecha de venta (derecha)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    if (numeroOrden > 0) doc.text(`N° ${numeroOrden}`, M, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RÓTULO DE ENVÍO", W / 2, y, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (fechaVentaTxt) doc.text(fechaVentaTxt, W - M, y, { align: "right" });
    y += 3;
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 7;

    // Bloque REMITE
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("REMITE:", M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(REMITENTE.nombre, M + 22, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DNI:", M, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(REMITENTE.dni, M + 22, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TEL:", W / 2, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(REMITENTE.telefono, W / 2 + 14, y);
    y += 4;
    doc.setLineWidth(0.8);
    doc.line(M, y, W - M, y);
    y += 8;

    // Bloque DESTINATARIO — grande y ordenado
    const labelW = 38;
    const rows: [string, string, number][] = [
      ["DESTINATARIO:", destinatario, 15],
      ["DNI:", dni, 18],
      ["AGENCIA:", agencia, 15],
      ["TELÉFONO:", telefono, 15],
      ["PEDIDO:", pedido, 15],
    ];
    for (const [label, val, fontSize] of rows) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label, M, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSize);
      const wrapped = doc.splitTextToSize(val || "-", W - M * 2 - labelW);
      doc.text(wrapped, M + labelW, y);
      const lines = Array.isArray(wrapped) ? wrapped.length : 1;
      y += Math.max(9, lines * (fontSize === 18 ? 7.5 : 6.5));
    }

    // Imprimir mediante iframe oculto: fuerza el diálogo de impresión del navegador.
    doc.autoPrint();
    const blobUrl = doc.output("bloburl") as unknown as string;

    // Reutilizar/crear un iframe oculto
    let iframe = document.getElementById("__rotulo_print__") as HTMLIFrameElement | null;
    if (iframe) iframe.remove();
    iframe = document.createElement("iframe");
    iframe.id = "__rotulo_print__";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = blobUrl;
    iframe.onload = () => {
      try {
        iframe!.contentWindow?.focus();
        iframe!.contentWindow?.print();
      } catch {
        // Fallback: abrir en pestaña nueva
        window.open(blobUrl, "_blank");
      }
    };
    document.body.appendChild(iframe);
  }

  return (
    <Modal open={open} onClose={onClose} title="🖨️ GENERAR RÓTULO DE ENVÍO" size="lg">
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/30 bg-accent/40 p-3">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase text-primary">Remite (fijo)</p>
            {numeroOrden > 0 && (
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                N° {numeroOrden}
                {fechaVentaTxt ? ` · ${fechaVentaTxt}` : ""}
              </span>
            )}
          </div>
          <p className="text-sm"><b>Nombre:</b> {REMITENTE.nombre}</p>
          <p className="text-sm"><b>DNI:</b> {REMITENTE.dni}</p>
          <p className="text-sm"><b>Teléfono:</b> {REMITENTE.telefono}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              label="Destinatario"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
            />
          </div>
          <TextField label="DNI" value={dni} onChange={(e) => setDni(e.target.value)} />
          <TextField label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <div className="relative w-full" ref={agenciaRef}>
            <TextField
              label="Agencia"
              accent="secondary"
              value={agencia}
              onFocus={() => setAgenciaOpen(true)}
              onChange={(e) => {
                setAgencia(e.target.value.toUpperCase());
                setAgenciaOpen(true);
              }}
              placeholder="Escribe para buscar…"
              autoComplete="off"
            />
            {agenciaOpen && agenciaSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 z-10 mt-1 max-h-72 overflow-y-auto rounded-lg border border-primary/30 bg-white shadow-card">
                {agenciaSuggestions.map((a) => (
                  <li
                    key={a.n}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setAgencia(a.n);
                      setAgenciaOpen(false);
                    }}
                    className="cursor-pointer border-b border-border/40 px-3 py-2 last:border-0 hover:bg-accent"
                  >
                    <p className="text-sm font-bold text-foreground">{a.n}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      <span className="italic">{a.p}</span>
                      {a.a ? <> · {a.a}</> : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="sm:col-span-2">
            <TextareaField
              label="Pedido"
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              placeholder="Descripción del pedido"
              rows={6}
              className="min-h-[140px] resize-y"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Formato: <b>180mm × 110mm horizontal</b>. Al pulsar <b>Imprimir</b> se
          abrirá el cuadro de impresión del navegador automáticamente.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <X size={16} /> Cerrar
          </button>
          <button
            type="button"
            onClick={generarPDF}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-primary-glow transition hover:bg-primary-dark"
          >
            <Printer size={16} /> Imprimir Rótulo
          </button>
        </div>
      </div>
    </Modal>
  );
}