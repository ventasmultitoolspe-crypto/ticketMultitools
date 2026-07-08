import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogIn, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PasswordWithEye } from "@/components/shalom/PasswordWithEye";
import logoAsset from "@/assets/multitools-logo.jpg.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Iniciar sesión — MULTITOOLS" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Ingrese usuario y contraseña");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("¡Bienvenido!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-login px-4 py-10">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-secondary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-light/40 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-24 items-center justify-center rounded-2xl bg-white px-6 py-3 shadow-card-hover">
            <img src={logoAsset.url} alt="Multitools" className="h-full w-auto object-contain" />
          </div>
          <p className="mt-1 text-sm text-white/85">
            Equipos y Herramientas · Gestión de ventas y pagos parciales
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white p-6 shadow-card-hover"
        >
          <h2 className="mb-4 text-lg font-bold text-primary">Iniciar sesión</h2>

          <label className="mb-1 block text-sm font-medium text-foreground">
            Usuario
          </label>
          <div className="mb-4 flex items-center rounded-lg border border-primary/40 bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <UserIcon size={18} className="mr-2 text-primary" />
            <input
              className="w-full bg-transparent py-2 text-sm outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="MultitoolsADM"
              autoComplete="username"
            />
          </div>

          <div className="mb-6">
            <PasswordWithEye
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-semibold text-secondary-foreground shadow-secondary-glow transition hover:bg-secondary-dark disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Acceso restringido al personal autorizado.
          </p>
        </form>
      </div>
    </main>
  );
}