import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate('/');
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centerPage">
      <div className="card authCard">
        <h1>Crear cuenta</h1>
        <p className="muted">Registro para rol Evaluador (por defecto).</p>
        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Nombre completo</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
            />
          </label>
          {error ? <div className="alert">{error}</div> : null}
          <button className="btn" disabled={loading}>
            {loading ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
        <p className="muted">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
