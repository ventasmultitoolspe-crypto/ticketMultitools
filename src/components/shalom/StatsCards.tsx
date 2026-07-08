import {
  BarChart3,
  Wallet,
  CheckCircle2,
  Clock,
  CreditCard,
} from "lucide-react";
import { formatMoney } from "@/lib/format";

export interface StatsData {
  total_ventas: number;
  monto_total: number;
  ventas_pagadas: number;
  ventas_pendientes: number;
  total_recaudado: number;
}

function Card({
  icon,
  label,
  value,
  color,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  gradient?: boolean;
}) {
  return (
    <div
      className="stat-card p-3 sm:p-4"
      style={
        gradient
          ? { borderImage: "linear-gradient(90deg,#076068,#fcbb19) 1", borderTopWidth: 4 }
          : color
            ? { borderTopColor: color }
            : undefined
      }
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className="mt-1 text-base font-extrabold text-foreground sm:text-2xl">{value}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary sm:h-11 sm:w-11" style={color ? { color, background: color + "14" } : undefined}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ data }: { data: StatsData | null }) {
  const s = data ?? {
    total_ventas: 0,
    monto_total: 0,
    ventas_pagadas: 0,
    ventas_pendientes: 0,
    total_recaudado: 0,
  };
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      <Card
        icon={<BarChart3 size={22} />}
        label="Total Ventas"
        value={String(s.total_ventas)}
        color="#076068"
      />
      <Card
        icon={<Wallet size={22} />}
        label="Monto Total"
        value={formatMoney(s.monto_total)}
        color="#fcbb19"
      />
      <Card
        icon={<CheckCircle2 size={22} />}
        label="Pagadas"
        value={String(s.ventas_pagadas)}
        color="#2e7d32"
      />
      <Card
        icon={<Clock size={22} />}
        label="Pendientes"
        value={String(s.ventas_pendientes)}
        color="#f57f17"
      />
      <Card
        icon={<CreditCard size={22} />}
        label="Recaudado"
        value={formatMoney(s.total_recaudado)}
        gradient
      />
    </div>
  );
}