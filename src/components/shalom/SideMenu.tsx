import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Wallet, Menu } from "lucide-react";
import { useState } from "react";

const items = [
  { to: "/dashboard", label: "Gestión de Ventas", icon: LayoutGrid },
  { to: "/cobros", label: "Cobros", icon: Wallet },
] as const;

export function SideMenu() {
  // Colapsado por defecto en móvil para ahorrar espacio
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 768;
    return false;
  });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={`sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r-2 border-primary/20 bg-white shadow-card transition-all ${
        collapsed ? "w-12" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-2 py-2">
        {!collapsed && (
          <span className="text-sm font-extrabold uppercase tracking-wide text-primary">
            Gestión de Ventas
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto rounded-md p-1.5 text-primary transition hover:bg-primary/10"
          aria-label="Alternar menú"
        >
          <Menu size={18} />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-1.5">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
              title={it.label}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{it.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}