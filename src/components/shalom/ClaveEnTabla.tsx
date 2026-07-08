import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { useState } from "react";

export function ClaveEnTabla({ clave, locked = false }: { clave: string; locked?: boolean }) {
  const [show, setShow] = useState(false);
  const isShown = show && !locked;
  return (
    <div className="inline-flex items-center gap-2">
      <KeyRound size={14} className="text-primary" />
      <span
        className={
          "font-mono text-sm " +
          (isShown ? "text-secondary-dark" : "tracking-widest text-foreground")
        }
      >
        {isShown ? clave : "•".repeat(Math.max(5, clave?.length ?? 5))}
      </span>
      <button
        type="button"
        onClick={() => !locked && setShow((s) => !s)}
        disabled={locked}
        className={
          "transition " +
          (locked
            ? "cursor-not-allowed text-muted-foreground/60"
            : "text-muted-foreground hover:text-primary")
        }
        title={locked ? "Disponible cuando la deuda esté totalmente pagada" : undefined}
        aria-label={locked ? "Clave bloqueada" : isShown ? "Ocultar clave" : "Mostrar clave"}
      >
        {locked ? <Lock size={16} /> : isShown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}