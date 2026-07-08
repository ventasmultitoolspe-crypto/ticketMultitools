import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

const base =
  "w-full rounded-lg border border-primary/40 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
  );
}

export function TextField({
  label,
  required,
  className,
  accent,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean; accent?: "primary" | "secondary" }) {
  const border =
    accent === "secondary"
      ? "border-secondary focus:border-secondary-dark focus:ring-secondary/20"
      : "";
  return (
    <div className="w-full">
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <input className={`${base} ${border} ${className ?? ""}`} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  required,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; required?: boolean }) {
  return (
    <div className="w-full">
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <select className={`${base} bg-white ${className ?? ""}`} {...props}>
        {children}
      </select>
    </div>
  );
}

export function TextareaField({
  label,
  required,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; required?: boolean }) {
  return (
    <div className="w-full">
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <textarea rows={3} className={`${base} ${className ?? ""}`} {...props} />
    </div>
  );
}