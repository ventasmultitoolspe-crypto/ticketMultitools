import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

export function PasswordWithEye({ label, className, ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          {...props}
          type={show ? "text" : "password"}
          className={
            "w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm outline-none transition focus:ring-2 " +
            (show
              ? "border-secondary ring-2 ring-secondary/30 "
              : "border-primary/40 focus:border-primary focus:ring-primary/20 ") +
            (className ?? "")
          }
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className={
            "absolute right-2 flex h-8 w-8 items-center justify-center rounded-md transition " +
            (show
              ? "text-secondary-dark hover:text-secondary"
              : "text-muted-foreground hover:text-primary")
          }
          aria-label={show ? "Ocultar" : "Mostrar"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}