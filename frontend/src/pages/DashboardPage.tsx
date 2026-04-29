import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/auth';

type EvaluationListItem = {
  id: number;
  title: string;
  systemName: string;
  userType: 'NOVICE' | 'EXPERT';
  usageContext: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  createdBy?: { id: number; email: string; fullName: string };
  _count?: { interfaces: number; evaluators: number };
  result: null | {
    effectivenessScore: number;
    efficiencyScore: number;
    satisfactionScore: number;
    overallScore: number;
    generatedAt: string;
  };
};

type InterfaceBreakdown = {
  canSeeAll: boolean;
  aggregate: {
    effectivenessScore: number;
    efficiencyScore: number;
    satisfactionScore: number;
    overallScore: number;
    totalAnswers: number;
    totalAttempts: number;
  };
  breakdown: Array<{
    interfaceId: number;
    interfaceName: string;
    effectivenessScore: number;
    efficiencyScore: number;
    satisfactionScore: number;
    overallScore: number;
    totalAnswers: number;
    totalAttempts: number;
  }>;
};

function percent(n: number) {
  return `${Math.round(n * 100)}%`;
}

function fmtEvaluationStatus(s: EvaluationListItem['status']) {
  if (s === 'DRAFT') return 'Borrador';
  if (s === 'IN_PROGRESS') return 'En progreso';
  return 'Completada';
}

function statusPillClass(s: EvaluationListItem['status']) {
  if (s === 'DRAFT') return 'pill pillStatusDraft';
  if (s === 'IN_PROGRESS') return 'pill pillStatusInProgress';
  return 'pill pillStatusCompleted';
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN';
  const [items, setItems] = useState<EvaluationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);
  const [interfaceBreakdown, setInterfaceBreakdown] = useState<InterfaceBreakdown | null>(null);
  const [loadingInterfaceBreakdown, setLoadingInterfaceBreakdown] = useState(false);
  const [interfaceBreakdownError, setInterfaceBreakdownError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<EvaluationListItem[]>('/evaluations', {
          token: token ?? undefined,
        });
        if (!cancelled) {
          setItems(res);
          setSelectedEvaluationId((current) => current ?? (res.find((x) => x.result)?.id ?? null));
        }
      } catch {
        if (!cancelled) setError('No se pudieron cargar las evaluaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const evaluationsWithResult = items.filter((x) => x.result);

  useEffect(() => {
    if (selectedEvaluationId === null) return;
    let cancelled = false;
    async function run() {
      setLoadingInterfaceBreakdown(true);
      setInterfaceBreakdownError(null);
      try {
        const res = await apiRequest<InterfaceBreakdown>(
          `/evaluations/${selectedEvaluationId}/interface-breakdown`,
          { token: token ?? undefined },
        );
        if (!cancelled) setInterfaceBreakdown(res);
      } catch {
        if (!cancelled) {
          setInterfaceBreakdown(null);
          setInterfaceBreakdownError('No se pudo cargar el detalle por interfaz');
        }
      } finally {
        if (!cancelled) setLoadingInterfaceBreakdown(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedEvaluationId, token]);

  const completed = items.filter((x) => x.status === 'COMPLETED').length;
  const inProgress = items.filter((x) => x.status === 'IN_PROGRESS').length;
  const draft = items.filter((x) => x.status === 'DRAFT').length;

  const scoredResults = items.map((x) => x.result).filter((x): x is NonNullable<EvaluationListItem['result']> => Boolean(x));
  const scored = scoredResults.map((x) => x.overallScore);
  const avgOverall =
    scored.length === 0
      ? null
      : scored.reduce((acc, v) => acc + v, 0) / scored.length;

  const avgDimension = {
    effectiveness:
      scoredResults.length === 0
        ? null
        : scoredResults.reduce((acc, x) => acc + x.effectivenessScore, 0) / scoredResults.length,
    efficiency:
      scoredResults.length === 0
        ? null
        : scoredResults.reduce((acc, x) => acc + x.efficiencyScore, 0) / scoredResults.length,
    satisfaction:
      scoredResults.length === 0
        ? null
        : scoredResults.reduce((acc, x) => acc + x.satisfactionScore, 0) / scoredResults.length,
  };

  async function deleteEvaluation(ev: EvaluationListItem) {
    if (!token) return;
    const wasSelected = selectedEvaluationId === ev.id;
    const ok = window.confirm(
      `¿Eliminar la evaluación "${ev.title}"?\n\nEsta acción eliminará también interfaces, tareas, preguntas, respuestas, intentos y resultados asociados.`,
    );
    if (!ok) return;

    setDeletingId(ev.id);
    setError(null);
    try {
      await apiRequest(`/evaluations/${ev.id}`, { method: 'DELETE', token: token ?? undefined });
      setItems((prev) => {
        const next = prev.filter((x) => x.id !== ev.id);
        setSelectedEvaluationId((current) => {
          if (current !== ev.id) return current;
          return next.find((x) => x.result)?.id ?? null;
        });
        return next;
      });
      if (wasSelected) setInterfaceBreakdown(null);
    } catch {
      setError('No se pudo eliminar la evaluación');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="stack">
      <div className="pageHeader">
        <div>
          <h1>Inicio</h1>
          <p className="muted">
            {user?.role?.name === 'ADMIN'
              ? 'Vista de administrador'
              : 'Vista de evaluador'}
          </p>
        </div>
        {isAdmin ? (
          <Link className="btn" to="/evaluations/new">
            Nueva evaluación
          </Link>
        ) : null}
      </div>

      {loading ? <div className="card">Cargando…</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="cardTitle">Evaluaciones</div>
          <div className="muted">
            {items.length} total · {completed} completadas · {inProgress} en
            progreso · {draft} borradores
          </div>
        </div>
        <div className="card">
          <div className="cardTitle">Promedio global</div>
          <div className="muted">
            {avgOverall === null
              ? 'Aún no hay resultados calculados'
              : `${Math.round(avgOverall * 100)}% (ISO 9241-11)`}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">Promedio por dimensión (ISO 9241-11)</div>
        {avgDimension.effectiveness === null ||
        avgDimension.efficiency === null ||
        avgDimension.satisfaction === null ? (
          <div className="muted">Aún no hay evaluaciones con resultados calculados.</div>
        ) : (
          <div className="stack">
            <div>
              <div className="muted">Efectividad {percent(avgDimension.effectiveness)}</div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 6 }}>
                <div
                  style={{
                    height: 10,
                    width: `${Math.round(avgDimension.effectiveness * 100)}%`,
                    background: 'var(--udenar-green)',
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="muted">Eficiencia {percent(avgDimension.efficiency)}</div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 6 }}>
                <div
                  style={{
                    height: 10,
                    width: `${Math.round(avgDimension.efficiency * 100)}%`,
                    background: 'var(--udenar-yellow)',
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="muted">Satisfacción {percent(avgDimension.satisfaction)}</div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 6 }}>
                <div
                  style={{
                    height: 10,
                    width: `${Math.round(avgDimension.satisfaction * 100)}%`,
                    background: 'var(--udenar-red)',
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="pageHeader">
          <div>
            <div className="cardTitle">Detalle por interfaz</div>
            <div className="muted">Selecciona una evaluación para ver el breakdown por pantalla.</div>
          </div>
          <select
            value={selectedEvaluationId ?? ''}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              if (!Number.isFinite(next)) return;
              setSelectedEvaluationId(next);
            }}
            disabled={evaluationsWithResult.length === 0}
          >
            <option value="" disabled>
              Selecciona evaluación
            </option>
            {evaluationsWithResult.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
        </div>
        {evaluationsWithResult.length === 0 ? (
          <div className="muted">Aún no hay evaluaciones con resultados calculados.</div>
        ) : null}
        {interfaceBreakdownError ? <div className="alert">{interfaceBreakdownError}</div> : null}
        {loadingInterfaceBreakdown ? <div className="muted">Cargando…</div> : null}
        {!loadingInterfaceBreakdown && interfaceBreakdown ? (
          <div className="stack">
            <div className="muted">
              Agregado: {percent(interfaceBreakdown.aggregate.overallScore)} · Respuestas{' '}
              {interfaceBreakdown.aggregate.totalAnswers} · Intentos{' '}
              {interfaceBreakdown.aggregate.totalAttempts}
            </div>
            <div className="grid">
              {interfaceBreakdown.breakdown.map((b) => (
                <div key={b.interfaceId} className="card">
                  <div className="cardTitle">{b.interfaceName}</div>
                  <div className="muted">Global {percent(b.overallScore)}</div>
                  <div className="muted">
                    E{percent(b.effectivenessScore)} · Ef{percent(b.efficiencyScore)} · S
                    {percent(b.satisfactionScore)}
                  </div>
                  <div style={{ height: 10, background: 'var(--border)', borderRadius: 6, marginTop: 8 }}>
                    <div
                      style={{
                        height: 10,
                        width: `${Math.round(b.overallScore * 100)}%`,
                        background: 'var(--udenar-green-700)',
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid">
        {items.map((ev) => (
          <Link key={ev.id} to={`/evaluations/${ev.id}`} className="card cardLink">
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10 }}>
              <div className="cardTitle">{ev.title}</div>
              {user &&
              (user.role.name === 'ADMIN' || ev.createdBy?.id === user.id) ? (
                <button
                  type="button"
                  className="btn btnDanger"
                  disabled={deletingId === ev.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void deleteEvaluation(ev);
                  }}
                  style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12 }}
                >
                  {deletingId === ev.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              ) : null}
            </div>
            <div className="muted">{ev.systemName}</div>
            <div className="pillRow">
              <span className="pill">{ev.userType === 'NOVICE' ? 'Novato' : 'Experto'}</span>
              <span className={statusPillClass(ev.status)}>{fmtEvaluationStatus(ev.status)}</span>
            </div>
            {typeof ev._count?.interfaces === 'number' || typeof ev._count?.evaluators === 'number' ? (
              <div className="muted" style={{ marginTop: 8 }}>
                {typeof ev._count?.interfaces === 'number' ? `Interfaces: ${ev._count.interfaces}` : null}
                {typeof ev._count?.interfaces === 'number' && typeof ev._count?.evaluators === 'number' ? ' · ' : null}
                {typeof ev._count?.evaluators === 'number' ? `Evaluadores: ${ev._count.evaluators}` : null}
              </div>
            ) : null}
            {ev.result ? (
              <div className="muted" style={{ marginTop: 8 }}>
                Score global: {Math.round(ev.result.overallScore * 100)}%
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
