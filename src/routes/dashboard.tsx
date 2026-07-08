import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  LogOut,
  Plus,
  Wallet,
  Eye,
  Pencil,
  Trash2,
  Users as UsersIcon,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import logoAsset from "@/assets/multitools-logo.jpg.asset.json";
import { useAuth } from "@/lib/auth";
import { supabase, type Venta } from "@/lib/supabase";
import { formatDate, formatMoney } from "@/lib/format";
import { formatTime12 } from "@/lib/format";
import { StatsCards, type StatsData } from "@/components/shalom/StatsCards";
import { FiltersBar, type Filters } from "@/components/shalom/FiltersBar";
import { EstadoBadge } from "@/components/shalom/EstadoBadge";
import { ClaveEnTabla } from "@/components/shalom/ClaveEnTabla";
import { NewSaleModal } from "@/components/shalom/NewSaleModal";
import { CollectPaymentModal } from "@/components/shalom/CollectPaymentModal";
import { PaymentHistoryModal } from "@/components/shalom/PaymentHistoryModal";
import { EditSaleModal } from "@/components/shalom/EditSaleModal";
import { DeleteSaleModal } from "@/components/shalom/DeleteSaleModal";
import { UsersManagementModal } from "@/components/shalom/UsersManagementModal";
import { ShippingLabelModal } from "@/components/shalom/ShippingLabelModal";
import { SideMenu } from "@/components/shalom/SideMenu";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Panel de Control — MULTITOOLS" }] }),
  component: DashboardPage,
});

function isoDay(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function rangeFor(f: Filters): { desde?: string; hasta?: string } {
  const now = new Date();
  if (f.rango === "hoy") {
    const d = isoDay(now);
    return { desde: d, hasta: d };
  }
  if (f.rango === "ayer") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const d = isoDay(y);
    return { desde: d, hasta: d };
  }
  if (f.rango === "7dias") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { desde: isoDay(s), hasta: isoDay(now) };
  }
  if (f.rango === "mes") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { desde: isoDay(s), hasta: isoDay(e) };
  }
  if (f.rango === "anio") {
    const s = new Date(now.getFullYear(), 0, 1);
    const e = new Date(now.getFullYear(), 11, 31);
    return { desde: isoDay(s), hasta: isoDay(e) };
  }
  if (f.rango === "personalizado") {
    return { desde: f.desde, hasta: f.hasta };
  }
  return {};
}

function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    estado: "todos",
    rango: "hoy",
  });
  const [showNew, setShowNew] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [collectTarget, setCollectTarget] = useState<Venta | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Venta | null>(null);
  const [editTarget, setEditTarget] = useState<Venta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Venta | null>(null);
  const [labelTarget, setLabelTarget] = useState<
    { nombre: string; dni: string; telefono: string; fechaVenta?: string; numeroOrden?: number } | null
  >(null);

  useEffect(() => {
    if (!user) navigate({ to: "/login", replace: true });
  }, [user, navigate]);

  const openLabelForVenta = useCallback((v: Venta, numeroTabla: number) => {
    setLabelTarget({
      nombre: v.clientes?.nombre_completo ?? "",
      dni: v.clientes?.dni ?? "",
      telefono: v.clientes?.telefono ?? "",
      fechaVenta: v.fecha_venta,
      numeroOrden: numeroTabla,
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("ventas")
        .select(
          "*, clientes:cliente_id (id, nombre_completo, dni, telefono), pagos (monto, fecha_pago, hora_pago)",
        )
        .order("fecha_venta", { ascending: false })
        .order("hora_venta", { ascending: false });

      const r = rangeFor(filters);
      if (r.desde) query = query.gte("fecha_venta", r.desde);
      if (r.hasta) query = query.lte("fecha_venta", r.hasta);

      const { data, error } = await query;
      if (error) throw error;
      let list = (data ?? []) as unknown as Venta[];

      // calcular totales y adelanto (primer pago)
      list = list.map((v) => {
        const pagosArr = v.pagos ?? [];
        const pagado = pagosArr.reduce((s, p) => s + Number(p.monto ?? 0), 0);
        const ordered = [...pagosArr].sort((a, b) => {
          const ka = `${a.fecha_pago ?? ""}T${a.hora_pago ?? ""}`;
          const kb = `${b.fecha_pago ?? ""}T${b.hora_pago ?? ""}`;
          return ka.localeCompare(kb);
        });
        const adelanto = ordered.length > 0 ? Number(ordered[0].monto ?? 0) : 0;
        const pendiente = Math.max(Number(v.monto_total ?? 0) - pagado, 0);
        const estadoCalc = pendiente <= 0 ? "pagado" : "pendiente";
        return { ...v, estado: estadoCalc as typeof v.estado, total_pagado: pagado, pendiente, adelanto };
      });

      if (filters.estado !== "todos") {
        list = list.filter((v) => v.estado === filters.estado);
      }

      const q = filters.search.trim().toLowerCase();
      if (q) {
        list = list.filter((v) => {
          const dni = v.clientes?.dni?.toLowerCase() ?? "";
          const tel = v.clientes?.telefono?.toLowerCase() ?? "";
          const nom = v.clientes?.nombre_completo?.toLowerCase() ?? "";
          return dni.includes(q) || tel.includes(q) || nom.includes(q);
        });
      }

      setVentas(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const stats: StatsData = useMemo(() => {
    const totalRecaudado = ventas.reduce((s, v) => s + (v.total_pagado ?? 0), 0);
    return {
      total_ventas: ventas.length,
      monto_total: ventas.reduce((s, v) => s + Number(v.monto_total ?? 0), 0),
      ventas_pagadas: ventas.filter((v) => v.estado === "pagado").length,
      ventas_pendientes: ventas.filter((v) => v.estado === "pendiente").length,
      total_recaudado: totalRecaudado,
    };
  }, [ventas]);

  function exportExcel() {
    if (ventas.length === 0) {
      toast.info("No hay ventas para exportar");
      return;
    }
    const rows = ventas.map((v, i) => ({
      "N°": ventas.length - i,
      Cliente: v.clientes?.nombre_completo ?? "",
      "DNI/CE": v.clientes?.dni ?? "",
      Teléfono: v.clientes?.telefono ?? "",
      "Fecha Venta": formatDate(v.fecha_venta),
      Hora: v.hora_venta ? String(v.hora_venta).slice(0, 5) : "",
      "Monto Total": Number(v.monto_total ?? 0),
      Adelanto: Number(v.adelanto ?? 0),
      Pagado: Number(v.total_pagado ?? 0),
      Pendiente: Number(v.pendiente ?? 0),
      Estado: v.estado,
      Observaciones: v.observaciones ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `ventas_multitools_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <SideMenu />
      <div className="flex-1 min-w-0 overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b-2 border-primary bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src={logoAsset.url} alt="Multitools" className="h-8 w-auto shrink-0 object-contain sm:h-11" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-extrabold leading-tight text-primary sm:text-lg">MULTITOOLS</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {now.toLocaleDateString("es-PE", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="truncate font-semibold text-foreground">{user.nombre || user.username}</p>
              <span
                className={
                  "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase " +
                  (user.rol === "administrador"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground")
                }
              >
                {user.rol}
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login", replace: true });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-destructive px-2 py-1.5 text-xs font-medium text-destructive-foreground transition hover:brightness-90 sm:px-3 sm:py-2 sm:text-sm"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-3 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-foreground sm:text-xl">Panel de Control</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground shadow-secondary-glow transition hover:bg-secondary-dark sm:px-4 sm:py-2 sm:text-sm"
            >
              <Plus size={14} /> Nueva Venta
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-primary-glow transition hover:bg-primary-dark sm:px-4 sm:py-2 sm:text-sm"
            >
              <FileSpreadsheet size={14} /> <span className="hidden xs:inline sm:inline">Exportar</span> Excel
            </button>
            {user.rol === "administrador" && (
              <button
                onClick={() => setShowUsers(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-accent sm:px-4 sm:py-2 sm:text-sm"
              >
                <UsersIcon size={14} /> Usuarios
              </button>
            )}
          </div>
        </div>

        <StatsCards data={stats} />

        <FiltersBar
          value={filters}
          onChange={setFilters}
          onReset={() => setFilters({ search: "", estado: "todos", rango: "hoy" })}
        />

        <div className="rounded-2xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr className="text-left">
                  <th className="px-3 py-3">N°</th>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">DNI/CE</th>
                  <th className="px-3 py-3">Teléfono</th>
                  <th className="px-3 py-3">Fecha/Hora</th>
                  <th className="px-3 py-3 text-right">Monto Total</th>
                  <th className="px-3 py-3 text-right">Adelanto</th>
                  <th className="px-3 py-3 text-right">Pagado</th>
                  <th className="px-3 py-3 text-right">Pendiente</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Clave</th>
                  <th className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-muted-foreground">
                      Cargando ventas…
                    </td>
                  </tr>
                )}
                {!loading && ventas.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-muted-foreground">
                      No hay ventas registradas con los filtros actuales.
                    </td>
                  </tr>
                )}
                {!loading &&
                  ventas.map((v, i) => {
                    const pendiente = v.pendiente ?? 0;
                    const canCollect = v.estado !== "pagado";
                    const esAdmin = user.rol === "administrador";
                    return (
                      <tr key={v.id} className="border-t border-border transition hover:bg-accent/40">
                        <td className="px-3 py-2 font-mono text-xs">{ventas.length - i}</td>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {v.clientes?.nombre_completo ?? "—"}
                        </td>
                        <td className="px-3 py-2">{v.clientes?.dni ?? "—"}</td>
                        <td className="px-3 py-2">{v.clientes?.telefono ?? "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatDate(v.fecha_venta)}
                          {v.hora_venta ? ` ${formatTime12(v.hora_venta)}` : ""}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{formatMoney(v.monto_total)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-primary">
                          {formatMoney(v.adelanto ?? 0)}
                        </td>
                        <td className="px-3 py-2 text-right">{formatMoney(v.total_pagado ?? 0)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-secondary-dark">
                          {formatMoney(pendiente)}
                        </td>
                        <td className="px-3 py-2">
                          <EstadoBadge estado={v.estado} />
                        </td>
                        <td className="px-3 py-2">
                          <ClaveEnTabla clave={v.clave_acceso} locked={(pendiente ?? 0) > 0.005} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setHistoryTarget(v)}
                              title="Ver historial"
                              className="rounded-md bg-primary/10 p-2 text-primary transition hover:bg-primary hover:text-primary-foreground"
                            >
                              <Eye size={14} />
                            </button>
                            {canCollect && (
                              <button
                                onClick={() => setCollectTarget(v)}
                                title="Cobrar"
                                className="rounded-md bg-secondary/20 p-2 text-secondary-dark transition hover:bg-secondary hover:text-secondary-foreground"
                              >
                                <Wallet size={14} />
                              </button>
                            )}
                            {esAdmin && (
                              <button
                                onClick={() => setEditTarget(v)}
                                title="Editar"
                                className="rounded-md bg-muted p-2 text-foreground transition hover:bg-accent"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {esAdmin && (
                              <button
                                onClick={() => setDeleteTarget(v)}
                                title="Eliminar"
                                className="rounded-md bg-destructive/10 p-2 text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => openLabelForVenta(v, ventas.length - i)}
                              title="Generar rótulo (PDF)"
                              className="rounded-md bg-primary/10 p-2 text-primary transition hover:bg-primary hover:text-primary-foreground"
                            >
                              <Printer size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="pb-6 text-center text-xs text-muted-foreground">
          MULTITOOLS · Equipos y Herramientas · Gestión de ventas con pagos parciales
        </p>
      </main>

      <NewSaleModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(cliente, venta) => {
          load();
          if (cliente) {
            // La nueva venta es la más reciente → toma el mayor N° de orden cronológico.
            setLabelTarget({
              ...cliente,
              fechaVenta: venta?.fecha_venta,
              numeroOrden: ventas.length + 1,
            });
          }
        }}
      />
      <CollectPaymentModal
        open={!!collectTarget}
        venta={collectTarget}
        onClose={() => setCollectTarget(null)}
        onCollected={load}
      />
      <PaymentHistoryModal
        open={!!historyTarget}
        venta={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
      <EditSaleModal
        open={!!editTarget}
        venta={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={load}
      />
      <DeleteSaleModal
        open={!!deleteTarget}
        venta={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={load}
      />
      <ShippingLabelModal
        open={!!labelTarget}
        cliente={labelTarget}
        onClose={() => setLabelTarget(null)}
      />
      {user.rol === "administrador" && (
        <UsersManagementModal open={showUsers} onClose={() => setShowUsers(false)} />
      )}
      </div>
    </div>
  );
}