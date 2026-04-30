import { useEffect, useMemo, useState } from 'react';
import { apiRequest, type ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';

type UserRow = {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
  role: { name: 'ADMIN' | 'EVALUATOR' };
};

type RoleName = UserRow['role']['name'];

export function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [roleDraftByUserId, setRoleDraftByUserId] = useState<Record<number, RoleName>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<UserRow[]>('/users', { token: token ?? undefined });
        if (!cancelled) {
          setUsers(res);
          setRoleDraftByUserId(
            Object.fromEntries(res.map((u) => [u.id, u.role.name] as const)),
          );
        }
      } catch (e) {
        const apiErr = e as Partial<ApiError>;
        if (!cancelled) {
          if (apiErr.status === 403) {
            setError('No tienes permisos para ver usuarios (solo ADMIN).');
          } else {
            setError('No se pudo cargar la lista de usuarios.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const dirtyCount = useMemo(() => {
    return users.reduce((acc, u) => {
      const draft = roleDraftByUserId[u.id];
      return acc + (draft && draft !== u.role.name ? 1 : 0);
    }, 0);
  }, [roleDraftByUserId, users]);

  async function saveRole(userId: number) {
    const nextRole = roleDraftByUserId[userId];
    const current = users.find((u) => u.id === userId);
    if (!current || !nextRole || nextRole === current.role.name) return;

    setSavingUserId(userId);
    setError(null);
    try {
      const updated = await apiRequest<UserRow>(`/users/${userId}/role`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ roleName: nextRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setRoleDraftByUserId((prev) => ({ ...prev, [userId]: updated.role.name }));
    } catch (e) {
      const apiErr = e as Partial<ApiError>;
      if (apiErr.status === 400 && apiErr.message) {
        setError(apiErr.message);
      } else if (apiErr.status === 403) {
        setError('No tienes permisos para cambiar roles (solo ADMIN).');
      } else {
        setError('No se pudo actualizar el rol.');
      }
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="stack">
      <div className="pageHeader">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">Administración de roles (ADMIN / EVALUATOR).</p>
        </div>
        <div className="muted">{dirtyCount > 0 ? `${dirtyCount} cambios sin guardar` : null}</div>
      </div>

      {loading ? <div className="card">Cargando…</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      {!loading ? (
        <div className="card">
          <div className="cardTitle">Lista de usuarios</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th style={{ width: 140 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const draftRole = roleDraftByUserId[u.id] ?? u.role.name;
                  const isDirty = draftRole !== u.role.name;
                  const isSaving = savingUserId === u.id;
                  return (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td className="muted">{u.email}</td>
                      <td>
                        <select
                          value={draftRole}
                          onChange={(e) => {
                            const next = e.target.value as RoleName;
                            setRoleDraftByUserId((prev) => ({ ...prev, [u.id]: next }));
                          }}
                          disabled={isSaving}
                        >
                          <option value="EVALUATOR">EVALUATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className={`btn ${isDirty ? '' : 'btnSecondary'}`}
                          disabled={!isDirty || isSaving}
                          onClick={() => void saveRole(u.id)}
                        >
                          {isSaving ? 'Guardando…' : 'Guardar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

