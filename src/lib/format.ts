export const CURRENCY = "S/ ";

export function formatMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return `${CURRENCY}${v.toFixed(2)}`;
}

// Parse YYYY-MM-DD as a LOCAL date (avoid UTC shift that moves the day back one).
function parseLocalDate(d: string | Date): Date | null {
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
  const s = String(d);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    return new Date(y, Number(dmy[2]) - 1, Number(dmy[1]));
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = parseLocalDate(d);
  if (!date) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Convert "HH:MM[:SS]" (or Date) to "h:mm a.m./p.m."
export function formatTime12(t: string | Date | null | undefined): string {
  if (!t) return "-";
  let h: number;
  let m: number;
  if (t instanceof Date) {
    h = t.getHours();
    m = t.getMinutes();
  } else {
    const parts = String(t).split(":");
    if (parts.length < 2) return "-";
    h = Number(parts[0]);
    m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return "-";
  }
  const ampm = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = parseLocalDate(d);
  if (!date) return "-";
  return `${formatDate(date)} ${formatTime12(date)}`;
}

// LOCAL today as YYYY-MM-DD (do NOT use toISOString — that returns UTC).
export function todayLocalISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// LOCAL current time HH:MM:SS.
export function nowLocalTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  "izipay-qr": "IZIPAY-QR",
  yape: "YAPE",
  plin: "PLIN",
  transferencia: "TRANSFERENCIA",
  otro: "OTRO",
};

export const PAYMENT_METHOD_ICONS: Record<string, string> = {
  "izipay-qr": "📱",
  yape: "💜",
  plin: "💙",
  transferencia: "🏦",
  otro: "🧾",
};

export function methodLabel(m: string | null | undefined): string {
  if (!m) return "-";
  return `${PAYMENT_METHOD_ICONS[m] ?? ""} ${PAYMENT_METHOD_LABELS[m] ?? m.toUpperCase()}`.trim();
}

export const PAYMENT_METHODS: string[] = [
  "izipay-qr",
  "yape",
  "plin",
  "transferencia",
  "otro",
];