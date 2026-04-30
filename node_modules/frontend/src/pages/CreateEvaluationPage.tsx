import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/auth';

export function CreateEvaluationPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [systemName, setSystemName] = useState('');
  const [userType, setUserType] = useState<'NOVICE' | 'EXPERT'>('NOVICE');
  const [usageContext, setUsageContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user?.role?.name !== 'ADMIN') return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = await apiRequest<{ id: number }>(`/evaluations`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ title, systemName, userType, usageContext }),
      });
      navigate(`/evaluations/${created.id}`);
    } catch {
      setError('No se pudo crear la evaluación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      <div className="pageHeader">
        <div>
          <h1>Nueva evaluación</h1>
          <p className="muted">Completa la información base para comenzar.</p>
        </div>
      </div>
      <div className="card">
        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Título</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
          </label>
          <label className="field">
            <span>Nombre del sistema</span>
            <input
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label className="field">
            <span>Tipo de usuario</span>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as 'NOVICE' | 'EXPERT')}
            >
              <option value="NOVICE">Novato</option>
              <option value="EXPERT">Experto</option>
            </select>
          </label>
          <label className="field">
            <span>Contexto de uso</span>
            <textarea
              value={usageContext}
              onChange={(e) => setUsageContext(e.target.value)}
              required
              minLength={5}
            />
          </label>
          {error ? <div className="alert">{error}</div> : null}
          <button className="btn" disabled={loading}>
            {loading ? 'Creando…' : 'Crear evaluación'}
          </button>
        </form>
      </div>
    </div>
  );
}
