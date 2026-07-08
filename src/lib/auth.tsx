import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, type Rol, type Usuario } from "./supabase";

const STORAGE_KEY = "shalom.session.v1";
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

interface Session {
  user: Usuario;
  loggedAt: number;
}

interface AuthCtx {
  user: Usuario | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

interface RawUsuario {
  id: string;
  username: string;
  nombre?: string | null;
  rol: Rol;
  activo: boolean;
  password?: string | null;
}

const Ctx = createContext<AuthCtx | null>(null);

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (Date.now() - parsed.loggedAt > SESSION_TIMEOUT_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isRlsRecursion(error: { message?: string }) {
  return (error.message ?? "").toLowerCase().includes("infinite recursion");
}

function toUsuario(row: RawUsuario): Usuario {
  return {
    id: row.id,
    username: row.username,
    nombre: row.nombre ?? null,
    rol: row.rol,
    activo: row.activo,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = readSession();
    if (s) setUser(s.user);
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const normalizedUsername = username.trim();

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (error) {
      if (isRlsRecursion(error)) {
        throw new Error(
          "La tabla usuarios tiene recursión infinita en RLS. Corrige esa política en Supabase para permitir el login.",
        );
      }
      throw new Error(error.message);
    }
    if (!data) throw new Error("Usuario o contraseña incorrectos");
    if (data.activo === false) throw new Error("Usuario desactivado");
    if (data.password === "hashed_password_here") {
      throw new Error(
        "El usuario existe, pero su contraseña en la base de datos sigue como placeholder. Actualiza usuarios.password.",
      );
    }
    if (data.password !== password) {
      throw new Error("Usuario o contraseña incorrectos");
    }

    const u = toUsuario(data as RawUsuario);
    const session: Session = { user: u, loggedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}