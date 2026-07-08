import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zjwnafepouoplywnpqne.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqd25hZmVwb3VvcGx5d25wcW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mjg5NzEsImV4cCI6MjA5ODUwNDk3MX0.UuOzg0YfuuTeHbpSf2KIoVf7o1_n5_jXpLzUaQTIUrw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type Rol = "administrador" | "trabajador";

export interface Usuario {
  id: string;
  username: string;
  nombre?: string | null;
  rol: Rol;
  activo: boolean;
}

export interface Cliente {
  id: string;
  nombre_completo: string;
  dni: string;
  telefono: string;
}

export type EstadoVenta = "pagado" | "pendiente" | "vencido";
export type MetodoPago =
  | "izipay-qr"
  | "yape"
  | "plin"
  | "transferencia"
  | "otro";

export interface Venta {
  id: string;
  cliente_id: string;
  monto_total: number;
  fecha_venta: string;
  hora_venta: string | null;
  fecha_limite_pago: string;
  clave_acceso: string;
  observaciones: string | null;
  estado: EstadoVenta;
  creado_por: string | null;
  clientes?: Cliente | null;
  // Calculados en cliente a partir de la relación pagos
  total_pagado?: number;
  pendiente?: number;
  adelanto?: number;
  vencido_flag?: boolean;
  pagos?: { monto: number; fecha_pago?: string; hora_pago?: string | null }[];
}

export interface Pago {
  id: string;
  venta_id: string;
  monto: number;
  metodo_pago: MetodoPago;
  fecha_pago: string;
  hora_pago: string | null;
  registrado_por: string | null;
  observacion: string | null;
}