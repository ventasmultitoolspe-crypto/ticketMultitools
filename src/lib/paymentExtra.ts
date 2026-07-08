import { supabase } from "@/lib/supabase";
import { todayLocalISO } from "@/lib/format";

export type MetodoPago =
  | "izipay-qr"
  | "yape"
  | "plin"
  | "transferencia"
  | "otro";

export interface ExtraFieldConfig {
  label: string;
  placeholder: string;
  /** Longitudes exactas permitidas del valor "limpio" (sin separadores). */
  allowedLengths: number[];
  /** Solo dígitos permitidos en la entrada limpia. */
  digitsOnly: true;
  /** Mensaje que se muestra si el largo no coincide. */
  lengthError: string;
  /** Formato de visualización opcional (ej. HH:MM). */
  format?: (raw: string) => string;
  /** Validación extra (ej. rango de hora). Devuelve null si es válido. */
  extraValidate?: (raw: string) => string | null;
}

export const EXTRA_FIELD_CONFIG: Partial<Record<MetodoPago, ExtraFieldConfig>> = {
  "izipay-qr": {
    label: "Hora",
    placeholder: "HH:MM",
    allowedLengths: [4],
    digitsOnly: true,
    lengthError: "La hora debe tener 4 dígitos (HH:MM).",
    format: (raw) => (raw.length <= 2 ? raw : `${raw.slice(0, 2)}:${raw.slice(2, 4)}`),
    extraValidate: (raw) => {
      if (raw.length !== 4) return null;
      const hh = Number(raw.slice(0, 2));
      const mm = Number(raw.slice(2, 4));
      if (hh < 0 || hh > 23) return "La hora (HH) debe estar entre 00 y 23.";
      if (mm < 0 || mm > 59) return "Los minutos (MM) deben estar entre 00 y 59.";
      return null;
    },
  },
  yape: {
    label: "Código de seguridad",
    placeholder: "3 a 8 dígitos",
    allowedLengths: [3, 4, 5, 6, 7, 8],
    digitsOnly: true,
    lengthError: "El código de seguridad debe tener entre 3 y 8 dígitos.",
  },
  plin: {
    label: "N. Sol",
    placeholder: "7 dígitos",
    allowedLengths: [7],
    digitsOnly: true,
    lengthError: "El N. Sol debe tener exactamente 7 dígitos.",
  },
  transferencia: {
    label: "Nº OPE.",
    placeholder: "7 dígitos",
    allowedLengths: [7],
    digitsOnly: true,
    lengthError: "El Nº OPE. debe tener exactamente 7 dígitos.",
  },
};

export function requiresExtra(metodo: string): boolean {
  return metodo in EXTRA_FIELD_CONFIG;
}

/**
 * Valida el valor "limpio" (solo dígitos) contra la configuración.
 * Devuelve un mensaje de error o null si es válido.
 */
export function validateExtra(metodo: string, raw: string): string | null {
  const cfg = EXTRA_FIELD_CONFIG[metodo as MetodoPago];
  if (!cfg) return null;
  if (!raw) return `${cfg.label} es obligatorio.`;
  if (!/^\d+$/.test(raw)) return `${cfg.label} debe contener solo dígitos.`;
  if (!cfg.allowedLengths.includes(raw.length)) return cfg.lengthError;
  if (cfg.extraValidate) {
    const err = cfg.extraValidate(raw);
    if (err) return err;
  }
  return null;
}

/** Construye el prefijo estándar para almacenar en `observacion`. */
export function buildObservacion(metodo: string, raw: string, userText: string): string | null {
  const cfg = EXTRA_FIELD_CONFIG[metodo as MetodoPago];
  const cleanUser = (userText || "").trim();
  if (!cfg) return cleanUser ? cleanUser : null;
  const stored = cfg.format ? cfg.format(raw) : raw;
  const tag = `[REF:${metodo}:${stored}]`;
  return cleanUser ? `${tag} ${cleanUser}` : tag;
}

/**
 * Parsea una observación con formato `[REF:metodo:valor] texto` producida por
 * {@link buildObservacion}. Devuelve la info del campo extra y el texto libre.
 */
export function parseObservacion(
  obs: string | null | undefined,
): { metodo: MetodoPago | null; label: string | null; value: string | null; userText: string } {
  const empty = { metodo: null, label: null, value: null, userText: "" };
  if (!obs) return empty;
  const m = obs.match(/^\[REF:([^:]+):([^\]]+)\]\s?(.*)$/);
  if (!m) return { ...empty, userText: obs };
  const metodo = m[1] as MetodoPago;
  const value = m[2];
  const cfg = EXTRA_FIELD_CONFIG[metodo];
  return {
    metodo,
    label: cfg?.label ?? metodo,
    value,
    userText: (m[3] ?? "").trim(),
  };
}

/**
 * Verifica si existe otro pago con el mismo método, monto y referencia.
 * Devuelve true si se encontró un posible duplicado.
 */
export async function checkDuplicatePago(params: {
  metodo: string;
  monto: number;
  raw: string;
}): Promise<boolean> {
  const cfg = EXTRA_FIELD_CONFIG[params.metodo as MetodoPago];
  if (!cfg) return false;
  const stored = cfg.format ? cfg.format(params.raw) : params.raw;
  const tag = `[REF:${params.metodo}:${stored}]`;
  const { data, error } = await supabase
    .from("pagos")
    .select("id")
    .eq("metodo_pago", params.metodo)
    .eq("monto", params.monto)
    .eq("fecha_pago", todayLocalISO())
    .ilike("observacion", `${tag}%`)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}