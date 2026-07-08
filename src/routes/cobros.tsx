import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LogOut, Search, X, Calendar } from "lucide-react";
import logoAsset from "@/assets/multitools-logo.jpg.asset.json";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { formatDate, formatMoney, formatTime12, methodLabel } from "@/lib/format";
import { parseObservacion } from "@/lib/paymentExtra";
import { SideMenu } from "@/components/shalom/SideMenu";

export const Route = createFileRoute("/cobros")({
  head: () => ({ meta: [{ title: "Cobros — MULTITOOLS" }] }),
  component: CobrosPage,
});

type Rango = "hoy" | "ayer" | "7dias" | "mes" | "personalizado";
type TipoCobro = "todos" | "cobros" | "adelantos";

interface PagoRow {
  id: string;
  venta_id: string;
  monto: number;
  metodo_pago: string;
  fecha_pago: string;
  hora_pago: string | null;
  observacion: string | null;
  registrado_por: string | null;
  ventas: {
    id: string;
    monto_total: number;
    clientes: {
      nombre_completo: string;
      dni: string;
      telefono: string;
    } | null;
  } | null;
  usuarios: { username?: string; nombre?: string | null } | null;
}

function isoDay(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function rangeFor(rango: Rango, desde?: string, hasta?: string): { desde?: string; hasta?: string } {
  const now = new Date();
  if (rango === "hoy") {
    const d = isoDay(now);
    return { desde: d, hasta: d };
  }
  if (rango === "ayer") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const d = isoDay(y);
    return { desde: d, hasta: d };
  }
  if (rango === "7dias") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { desde: isoDay(s), hasta: isoDay(now) };
  }
  if (rango === "mes") {
    const s = new Date(now);
    s.setDate(s.getDate() - 30);
    return { desde: isoDay(s), hasta: isoDay(now) };
  }
  return { desde, hasta };
}

function CobrosPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PagoRow[]>([]);
  const [totalPagadoMap, setTotalPagadoMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tipo, setTipo] = useState<TipoCobro>("todos");
  const [rango, setRango] = useState<Rango>("hoy");
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");

  useEffect(() => {
    if (!user) navigate({ to: "/login", replace: true });
  }, [user, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = rangeFor(rango, desde, hasta);
      let query = supabase
        .from("pagos")
        .select(
          "*, ventas:venta_id(id, monto_total, clientes:cliente_id(nombre_completo, dni, telefono)), usuarios:registrado_por(username, nombre)",
        )
        .order("fecha_pago", { ascending: false });
      if (r.desde) query = query.gte("fecha_pago", r.desde);
      if (r.hasta) query = query.lte("fecha_pago", r.hasta);

      const { data, error } = await query;
      if (error) throw error;
      let list = (data ?? []) as unknown as PagoRow[];

      // Ordenar por fecha + hora de cobro, más antiguo primero (ascendente)
      list.sort((a, b) => {
        const ta = new Date(`${a.fecha_pago}T${a.hora_pago || "00:00:00"}`).getTime();
        const tb = new Date(`${b.fecha_pago}T${b.hora_pago || "00:00:00"}`).getTime();
        return ta - tb;
      });

      const q = search.trim().toLowerCase();
      if (q) {
        list = list.filter((p) => {
          const dni = p.ventas?.clientes?.dni?.toLowerCase() ?? "";
          const tel = p.ventas?.clientes?.telefono?.toLowerCase() ?? "";
          return dni.includes(q) || tel.includes(q);
        });
      }

      // Traer totales pagados por venta (suma total, no filtrada por fecha)
      const ventaIds = Array.from(new Set(list.map((p) => p.venta_id)));
      const map: Record<string, number> = {};
      if (ventaIds.length > 0) {
        const { data: allPagos } = await supabase
          .from("pagos")
          .select("venta_id, monto")
          .in("venta_id", ventaIds);
        (allPagos ?? []).forEach((p: { venta_id: string; monto: number }) => {
          map[p.venta_id] = (map[p.venta_id] ?? 0) + Number(p.monto ?? 0);
        });
      }

      if (tipo !== "todos") {
        list = list.filter((p) => {
          const totalPagado = map[p.venta_id] ?? 0;
          const montoTotal = p.ventas?.monto_total ?? 0;
          const esCobroCompleto = totalPagado >= montoTotal && montoTotal > 0;
          return tipo === "cobros" ? esCobroCompleto : !esCobroCompleto;
        });
      }

      setRows(list);
      setTotalPagadoMap(map);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar cobros");
    } finally {
      setLoading(false);
    }
  }, [rango, desde, hasta, search, tipo]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const totalCobrado = useMemo(
    () => rows.reduce((s, r) => s + Number(r.monto ?? 0), 0),
    [rows],
  );

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <SideMenu />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 border-b-2 border-orange-500 bg-white">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <img src={logoAsset.url} alt="Multitools" className="h-8 w-auto shrink-0 object-contain sm:h-11" />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-extrabold leading-tight text-orange-600 sm:text-lg">
                  MULTITOOLS · Cobros
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">Historial de pagos registrados</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden text-right text-sm sm:block">
                <p className="truncate font-semibold text-foreground">{user.nombre || user.username}</p>
                <span className="inline-block rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
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
            <h2 className="text-lg font-bold text-foreground sm:text-xl">Cobros</h2>
            <div className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
              <span className="text-muted-foreground">Total cobrado: </span>
              <b className="text-orange-600">{formatMoney(totalCobrado)}</b>
              <span className="ml-3 text-muted-foreground">Registros: </span>
              <b className="text-orange-600">{rows.length}</b>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-card sm:p-4">
            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto sm:min-w-[240px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Buscar por DNI o Teléfono
                </label>
                <div className="flex gap-2">
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSearch(searchInput.trim());
                    }}
                    placeholder="DNI o Teléfono"
                    className="min-w-0 flex-1 rounded-lg border border-orange-400/60 bg-white px-2 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    onClick={() => setSearch(searchInput.trim())}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-orange-500 px-2 py-2 text-sm font-medium text-white transition hover:bg-orange-600 sm:px-3"
                  >
                    <Search size={16} /> <span className="hidden sm:inline">Buscar</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setTipo("todos");
                      setRango("hoy");
                      setDesde("");
                      setHasta("");
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-muted px-2 py-2 text-sm font-medium text-foreground transition hover:bg-accent sm:px-3"
                  >
                    <X size={16} /> <span className="hidden sm:inline">Limpiar</span>
                  </button>
                </div>
              </div>

              <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[170px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Tipo de pago
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoCobro)}
                  className="w-full rounded-lg border border-orange-400/60 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                >
                  <option value="todos">🔘 Todos</option>
                  <option value="cobros">✅ Cobros completos</option>
                  <option value="adelantos">💵 Adelantos</option>
                </select>
              </div>

              <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[180px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  <Calendar size={12} className="mr-1 inline" /> Fecha
                </label>
                <select
                  value={rango}
                  onChange={(e) => setRango(e.target.value as Rango)}
                  className="w-full rounded-lg border border-orange-400/60 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                >
                  <option value="hoy">📅 Hoy</option>
                  <option value="ayer">📅 Ayer</option>
                  <option value="7dias">📅 Hace 7 días</option>
                  <option value="mes">📅 Hace un mes</option>
                  <option value="personalizado">📅 Personalizado</option>
                </select>
              </div>

              {rango === "personalizado" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Desde</label>
                    <input
                      type="date"
                      value={desde}
                      onChange={(e) => setDesde(e.target.value)}
                      className="rounded-lg border border-orange-400/60 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Hasta</label>
                    <input
                      type="date"
                      value={hasta}
                      onChange={(e) => setHasta(e.target.value)}
                      className="rounded-lg border border-orange-400/60 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="bg-orange-500 text-white">
                  <tr className="text-left">
                    <th className="px-3 py-3">N°</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Nº DNI</th>
                    <th className="px-3 py-3">Teléfono</th>
                    <th className="px-3 py-3 text-right">Monto Total</th>
                    <th className="px-3 py-3 text-right">Pagado</th>
                    <th className="px-3 py-3 text-right">Monto cobrado</th>
                    <th className="px-3 py-3">Fecha de cobro</th>
                    <th className="px-3 py-3">Método de pago</th>
                    <th className="px-3 py-3">Observación</th>
                    <th className="px-3 py-3">Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-muted-foreground">
                        Cargando cobros…
                      </td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-muted-foreground">
                        No hay cobros registrados con los filtros actuales.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    rows.map((p, i) => {
                      const cli = p.ventas?.clientes;
                      const totalPagado = totalPagadoMap[p.venta_id] ?? 0;
                      const parsed = parseObservacion(p.observacion);
                      const nombreRegistrado =
                        p.usuarios?.nombre || p.usuarios?.username || "—";
                      return (
                        <tr
                          key={p.id}
                          className="border-t border-border transition hover:bg-orange-50/50"
                        >
                          <td className="px-3 py-2 font-mono text-xs">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-foreground">
                            {cli?.nombre_completo ?? "—"}
                          </td>
                          <td className="px-3 py-2">{cli?.dni ?? "—"}</td>
                          <td className="px-3 py-2">{cli?.telefono ?? "—"}</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatMoney(p.ventas?.monto_total ?? 0)}
                          </td>
                          <td className="px-3 py-2 text-right">{formatMoney(totalPagado)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-orange-600">
                            {formatMoney(p.monto)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatDate(p.fecha_pago)}
                            {p.hora_pago ? ` ${formatTime12(p.hora_pago)}` : ""}
                          </td>
                          <td className="px-3 py-2">{methodLabel(p.metodo_pago)}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {parsed.label && parsed.value ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex w-fit items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                                  <span>{parsed.label}:</span>
                                  <span className="tracking-wide">{parsed.value}</span>
                                </span>
                                {parsed.userText && (
                                  <span className="text-xs">{parsed.userText}</span>
                                )}
                              </div>
                            ) : parsed.userText ? (
                              parsed.userText
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2">{nombreRegistrado}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="pb-6 text-center text-xs text-muted-foreground">
            MULTITOOLS · Equipos y Herramientas · Registro de cobros
          </p>
        </main>
      </div>
    </div>
  );
}