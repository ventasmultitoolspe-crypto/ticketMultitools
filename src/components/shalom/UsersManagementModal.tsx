import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Users, Plus, Save, Power, X, Pencil } from "lucide-react";
import { Modal } from "./Modal";
import { TextField, SelectField } from "./Field";
import { PasswordWithEye } from "./PasswordWithEye";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface Row {
  id: string;
  email: string;
  username: string;
  nombre: string | null;
  rol: "administrador" | "trabajador";
  activo: boolean;
}

export function UsersManagementModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: "", nombre: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    nombre: "",
    password: "",
    rol: "trabajador" as Row["rol"],
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, email, username, nombre, rol, activo")
      .order("username");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.email || form.password.length < 4)
      return toast.error("Usuario, email y clave (4+) obligatorios");
    const { error } = await supabase.from("usuarios").insert({
      username: form.username.trim(),
      email: form.email.trim(),
      nombre: form.nombre || null,
      password: form.password,
      rol: form.rol,
      activo: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Usuario creado");
    setForm({ username: "", email: "", nombre: "", password: "", rol: "trabajador" });
    load();
  }

  async function toggle(u: Row) {
    const { error } = await supabase
      .from("usuarios")
      .update({ activo: !u.activo })
      .eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.activo ? "Usuario desactivado" : "Usuario activado");
    load();
  }

  async function changeRol(u: Row, rol: Row["rol"]) {
    const { error } = await supabase.from("usuarios").update({ rol }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success("Rol actualizado");
    load();
  }

  function startEdit(u: Row) {
    setEditingId(u.id);
    setEditForm({ username: u.username, nombre: u.nombre ?? "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ username: "", nombre: "" });
  }

  async function saveEdit(u: Row) {
    if (!isAdmin) return toast.error("Solo el administrador puede editar usuarios");
    const username = editForm.username.trim();
    if (!username) return toast.error("El usuario es obligatorio");
    setSavingEdit(true);
    const { error } = await supabase
      .from("usuarios")
      .update({ username, nombre: editForm.nombre.trim() || null })
      .eq("id", u.id);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    toast.success("Usuario actualizado");
    cancelEdit();
    load();
  }

  return (
    <Modal open={open} onClose={onClose} title={<span className="inline-flex items-center gap-2"><Users size={18}/> Gestión de Usuarios</span>} size="xl">
      <form onSubmit={create} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted p-4 sm:grid-cols-6">
        <TextField
          label="Usuario"
          required
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <TextField
          label="Email"
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <div>
          <PasswordWithEye
            label="Contraseña *"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <SelectField
          label="Rol"
          value={form.rol}
          onChange={(e) => setForm({ ...form, rol: e.target.value as Row["rol"] })}
        >
          <option value="trabajador">Trabajador</option>
          <option value="administrador">Administrador</option>
        </SelectField>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-secondary-glow transition hover:bg-secondary-dark"
          >
            <Plus size={16} /> Crear
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Usuario</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Rol</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-3 py-2 font-medium">
                    {editingId === u.id && isAdmin ? (
                      <input
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full rounded-md border border-border bg-white px-2 py-1 text-xs"
                      />
                    ) : (
                      u.username
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editingId === u.id && isAdmin ? (
                      <input
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        className="w-full rounded-md border border-border bg-white px-2 py-1 text-xs"
                      />
                    ) : (
                      u.nombre ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={u.rol}
                      onChange={(e) => changeRol(u, e.target.value as Row["rol"])}
                      className="rounded-md border border-border bg-white px-2 py-1 text-xs"
                    >
                      <option value="administrador">Administrador</option>
                      <option value="trabajador">Trabajador</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {u.activo ? (
                      <span className="badge-pagado">Activo</span>
                    ) : (
                      <span className="badge-vencido">Inactivo</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {isAdmin && editingId === u.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(u)}
                            disabled={savingEdit}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary-dark disabled:opacity-60"
                          >
                            <Save size={14} /> Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1 text-xs font-medium transition hover:bg-accent"
                          >
                            <X size={14} /> Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {isAdmin && (
                            <button
                              onClick={() => startEdit(u)}
                              className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1 text-xs font-medium transition hover:bg-accent"
                            >
                              <Pencil size={14} /> Editar
                            </button>
                          )}
                          <button
                            onClick={() => toggle(u)}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1 text-xs font-medium transition hover:bg-accent"
                          >
                            <Power size={14} /> {u.activo ? "Desactivar" : "Activar"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          <X size={16} /> Cerrar
        </button>
      </div>
    </Modal>
  );
}