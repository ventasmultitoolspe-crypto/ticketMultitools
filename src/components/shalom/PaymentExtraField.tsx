import { FieldLabel } from "./Field";
import { EXTRA_FIELD_CONFIG, type MetodoPago } from "@/lib/paymentExtra";

interface Props {
  metodo: string;
  /** Valor "limpio" (solo dígitos). */
  value: string;
  onChange: (raw: string) => void;
}

/**
 * Campo especial dependiente del método de pago. Se muestra con borde rojo
 * para diferenciarlo de la "Clave de Envío" y otros campos comunes.
 */
export function PaymentExtraField({ metodo, value, onChange }: Props) {
  const cfg = EXTRA_FIELD_CONFIG[metodo as MetodoPago];
  if (!cfg) return null;
  const maxLen = Math.max(...cfg.allowedLengths);
  const display = cfg.format ? cfg.format(value) : value;

  return (
    <div className="w-full">
      <FieldLabel required>
        <span className="text-red-600">{cfg.label}</span>
      </FieldLabel>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        placeholder={cfg.placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, maxLen);
          onChange(digits);
        }}
        className="w-full rounded-lg border-2 border-red-500 bg-white px-3 py-2 text-sm font-semibold tracking-wide text-red-700 outline-none transition placeholder:text-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-200"
      />
      <p className="mt-1 text-xs text-red-500">{describeLengths(cfg.allowedLengths)}</p>
    </div>
  );
}

function describeLengths(lengths: number[]): string {
  if (lengths.length === 1) return `Debe tener exactamente ${lengths[0]} dígitos.`;
  const sorted = [...lengths].sort((a, b) => a - b);
  const consecutive = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
  if (consecutive) return `Debe tener entre ${sorted[0]} y ${sorted[sorted.length - 1]} dígitos.`;
  return `Debe tener ${sorted.join(" o ")} dígitos.`;
}