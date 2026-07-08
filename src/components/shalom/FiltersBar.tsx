import { Search, X, Calendar } from "lucide-react";
import { useState } from "react";

export interface Filters {
  search: string;
  estado: "todos" | "pagado" | "pendiente";
  rango: "hoy" | "ayer" | "7dias" | "mes" | "anio" | "personalizado" | "todo";
  desde?: string;
  hasta?: string;
}

export function FiltersBar({
  value,
  onChange,
  onReset,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}) {
  const [local, setLocal] = useState(value.search);

  function apply(patch: Partial<Filters>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-card sm:p-4">
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        <div className="min-w-0 flex-1 basis-full sm:basis-auto sm:min-w-[240px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Buscar por DNI o Teléfono
          </label>
          <div className="flex gap-2">
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") apply({ search: local.trim() });
              }}
              placeholder="DNI o Teléfono"
              className="min-w-0 flex-1 rounded-lg border border-primary/40 bg-white px-2 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={() => apply({ search: local.trim() })}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-dark sm:px-3"
            >
              <Search size={16} /> <span className="hidden sm:inline">Buscar</span>
            </button>
            <button
              onClick={() => {
                setLocal("");
                onReset();
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-muted px-2 py-2 text-sm font-medium text-foreground transition hover:bg-accent sm:px-3"
            >
              <X size={16} /> <span className="hidden sm:inline">Limpiar</span>
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[170px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            <Calendar size={12} className="mr-1 inline" /> Fecha
          </label>
          <select
            value={value.rango}
            onChange={(e) => apply({ rango: e.target.value as Filters["rango"] })}
            className="w-full rounded-lg border border-primary/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="todo">📅 Todas las fechas</option>
            <option value="hoy">📅 Hoy</option>
            <option value="ayer">📅 Ayer</option>
            <option value="7dias">📅 Hace 7 días</option>
            <option value="mes">📅 Este mes</option>
            <option value="anio">📅 Este año</option>
            <option value="personalizado">📅 Personalizado</option>
          </select>
        </div>

        {value.rango === "personalizado" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Desde
              </label>
              <input
                type="date"
                value={value.desde ?? ""}
                onChange={(e) => apply({ desde: e.target.value })}
                className="rounded-lg border border-primary/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Hasta
              </label>
              <input
                type="date"
                value={value.hasta ?? ""}
                onChange={(e) => apply({ hasta: e.target.value })}
                className="rounded-lg border border-primary/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </>
        )}

        <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[170px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Estado
          </label>
          <select
            value={value.estado}
            onChange={(e) => apply({ estado: e.target.value as Filters["estado"] })}
            className="w-full rounded-lg border border-primary/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="todos">🔘 Todos</option>
            <option value="pagado">✅ Pagados</option>
            <option value="pendiente">⏳ Pendientes</option>
          </select>
        </div>
      </div>
    </div>
  );
}