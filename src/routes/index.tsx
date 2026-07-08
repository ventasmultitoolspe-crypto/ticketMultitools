import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-login">
      <div className="rounded-2xl bg-white/95 px-8 py-6 shadow-card-hover">
        <p className="text-lg font-semibold text-primary">MULTITOOLS</p>
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    </div>
  );
}