import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest, getApiBaseUrl, type ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useEvaluationDraftPersistence, useEvaluationPermissions } from './EvaluationDetailPage.hooks';
import type {
  AttemptDraft,
  Completeness,
  Evaluation,
  EvaluationEvaluator,
  Interface,
  InterfaceBreakdown,
  InterfaceEdit,
  ManualUserStory,
  Person,
  Question,
  QuestionEdit,
  Result,
  ResultsBreakdown,
  StepId,
  Task,
  TaskEdit,
} from './EvaluationDetailPage.types';

function percent(n: number) {
  return `${Math.round(n * 100)}%`;
}

function fmtEvaluationStatus(s: Evaluation['status']) {
  if (s === 'DRAFT') return 'Borrador';
  if (s === 'IN_PROGRESS') return 'En progreso';
  return 'Completada';
}

function statusPillClass(s: Evaluation['status']) {
  if (s === 'DRAFT') return 'pill pillStatusDraft';
  if (s === 'IN_PROGRESS') return 'pill pillStatusInProgress';
  return 'pill pillStatusCompleted';
}

function fmtDimension(d: Question['dimension']) {
  if (d === 'EFFECTIVENESS') return 'Efectividad';
  if (d === 'EFFICIENCY') return 'Eficiencia';
  return 'Satisfacción';
}

function dimensionPillClass(d: Question['dimension']) {
  if (d === 'EFFECTIVENESS') return 'pill pillDimEffectiveness';
  if (d === 'EFFICIENCY') return 'pill pillDimEfficiency';
  return 'pill pillDimSatisfaction';
}

function fmtQuestionType(t: Question['type']) {
  if (t === 'LIKERT_1_5') return 'Likert 1-5';
  if (t === 'NUMBER') return 'Número';
  if (t === 'BOOLEAN') return 'Sí/No';
  return 'Texto';
}

function fmtMosCow(p: ManualUserStory['mosCow']) {
  if (p === 'MUST') return 'Debe';
  if (p === 'SHOULD') return 'Debería';
  if (p === 'COULD') return 'Podría';
  return 'No se hará';
}

function answersFingerprint(questions: Question[], answers: Record<number, unknown>) {
  const entries: Array<[number, unknown]> = [];
  for (const q of questions) {
    const v = answers[q.id];
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) continue;
      entries.push([q.id, t]);
      continue;
    }
    entries.push([q.id, v]);
  }
  entries.sort((a, b) => a[0] - b[0]);
  return JSON.stringify(entries);
}

function typePillClass(t: Question['type']) {
  if (t === 'LIKERT_1_5') return 'pill pillTypeLikert';
  if (t === 'NUMBER') return 'pill pillTypeNumber';
  if (t === 'BOOLEAN') return 'pill pillTypeBoolean';
  return 'pill pillTypeText';
}

function formatAttemptValue(label: string, value: string) {
  return value.trim() ? `${label}: ${value}` : null;
}

export function EvaluationDetailPage() {
  const { token, user } = useAuth();
  const params = useParams();
  const evaluationId = Number(params.id);
  const draftKey = `pf:evaluationDraft:${evaluationId}`;
  const tasksSectionRef = useRef<HTMLDivElement | null>(null);
  const questionnaireSectionRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledQuestionIdRef = useRef<number | null>(null);
  const [ev, setEv] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addingInterface, setAddingInterface] = useState(false);
  const [interfaceName, setInterfaceName] = useState('');
  const [interfaceImageUrl, setInterfaceImageUrl] = useState('');
  const [interfacePrototypeUrl, setInterfacePrototypeUrl] = useState('');
  const [interfaceEdits, setInterfaceEdits] = useState<Record<number, InterfaceEdit>>({});
  const [savingInterface, setSavingInterface] = useState(false);
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<number | null>(null);
  const [questionPrompt, setQuestionPrompt] = useState('');
  const [questionHelpText, setQuestionHelpText] = useState('');
  const [questionIsRequired, setQuestionIsRequired] = useState<'' | 'true' | 'false'>('');
  const [questionWeight, setQuestionWeight] = useState('');
  const [questionDimension, setQuestionDimension] = useState<
    '' | 'EFFECTIVENESS' | 'EFFICIENCY' | 'SATISFACTION'
  >('');
  const [questionType, setQuestionType] = useState<
    '' | 'NUMBER' | 'LIKERT_1_5' | 'TEXT' | 'BOOLEAN'
  >('');
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskTargetTimeSec, setTaskTargetTimeSec] = useState('');
  const [taskTargetSteps, setTaskTargetSteps] = useState('');
  const [attemptDrafts, setAttemptDrafts] = useState<Record<number, AttemptDraft>>({});
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [answersByInterface, setAnswersByInterface] = useState<Record<number, Record<number, unknown>>>(
    {},
  );
  const [savedAnswersFingerprintByInterfaceId, setSavedAnswersFingerprintByInterfaceId] = useState<
    Record<number, string>
  >({});
  const [submittedInterfaceIdMap, setSubmittedInterfaceIdMap] = useState<Record<number, true>>({});
  const [loadingSavedAnswersInterfaceId, setLoadingSavedAnswersInterfaceId] = useState<number | null>(null);
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [computing, setComputing] = useState(false);
  const [savingScoringWeights, setSavingScoringWeights] = useState(false);
  const [scoringWeightsDraft, setScoringWeightsDraft] = useState<{
    effectiveness: string;
    efficiency: string;
    satisfaction: string;
  }>({ effectiveness: '', efficiency: '', satisfaction: '' });
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [step, setStep] = useState<StepId>('userStories');
  const [pendingScrollQuestionId, setPendingScrollQuestionId] = useState<number | null>(null);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [manualStoryDraft, setManualStoryDraft] = useState<{
    interfaceId: number | null;
    recommendedInterfaceId: number | null;
    title: string;
    narrative: string;
    acceptanceCriteria: string;
    status: '' | ManualUserStory['status'];
    mosCow: '' | ManualUserStory['mosCow'];
    priority: string;
    riceReach: string;
    riceImpact: string;
    riceConfidence: string;
    riceEffort: string;
  }>({
    interfaceId: null,
    recommendedInterfaceId: null,
    title: '',
    narrative: '',
    acceptanceCriteria: '',
    status: '',
    mosCow: '',
    priority: '',
    riceReach: '',
    riceImpact: '',
    riceConfidence: '',
    riceEffort: '',
  });
  const [manualStoryEdits, setManualStoryEdits] = useState<
    Record<
      number,
      Partial<{
        interfaceId: number | null;
        recommendedInterfaceId: number | null;
        title: string;
        narrative: string;
        acceptanceCriteria: string;
        status: ManualUserStory['status'];
        mosCow: ManualUserStory['mosCow'];
        priority: string;
        riceReach: string;
        riceImpact: string;
        riceConfidence: string;
        riceEffort: string;
      }>
    >
  >({});
  const [linkingManualStoryId, setLinkingManualStoryId] = useState<number | null>(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionWorking, setSessionWorking] = useState(false);
  const [interfaceImageFileError, setInterfaceImageFileError] = useState<string | null>(null);
  const [taskEdits, setTaskEdits] = useState<Record<number, TaskEdit>>({});
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskWorkingId, setTaskWorkingId] = useState<number | null>(null);
  const [questionEdits, setQuestionEdits] = useState<Record<number, QuestionEdit>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionWorkingId, setQuestionWorkingId] = useState<number | null>(null);
  const [resultsBreakdown, setResultsBreakdown] = useState<ResultsBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [interfaceBreakdown, setInterfaceBreakdown] = useState<InterfaceBreakdown | null>(null);
  const [loadingInterfaceBreakdown, setLoadingInterfaceBreakdown] = useState(false);
  const [showInterfaceBreakdown, setShowInterfaceBreakdown] = useState(false);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);
  const [loadingCompleteness, setLoadingCompleteness] = useState(false);
  const [completenessLoadedAt, setCompletenessLoadedAt] = useState<string | null>(null);
  const [mySelectedInterfaceId, setMySelectedInterfaceId] = useState<number | null>(null);
  const [mySelectionDraftId, setMySelectionDraftId] = useState<number | null>(null);
  const [loadingMySelection, setLoadingMySelection] = useState(false);
  const [savingManualStoryRecommendedId, setSavingManualStoryRecommendedId] = useState<number | null>(null);

  const { canManage, isAdmin, canSubmit } = useEvaluationPermissions(user, ev);

  function patchInterfaceEdit(interfaceId: number, edit: InterfaceEdit, updates: Partial<InterfaceEdit>) {
    setInterfaceEdits((s) => ({
      ...s,
      [interfaceId]: { ...edit, ...updates },
    }));
  }

  function patchQuestionEdit(questionId: number, edit: QuestionEdit, updates: Partial<QuestionEdit>) {
    setQuestionEdits((s) => ({
      ...s,
      [questionId]: { ...edit, ...updates },
    }));
  }

  function patchTaskEdit(taskId: number, edit: TaskEdit, updates: Partial<TaskEdit>) {
    setTaskEdits((s) => ({
      ...s,
      [taskId]: { ...edit, ...updates },
    }));
  }

  const loadMySelection = useCallback(async () => {
    setLoadingMySelection(true);
    try {
      const selection = await apiRequest<{ interfaceId: number } | null>(
        `/evaluations/${evaluationId}/selection`,
        { token: token ?? undefined },
      );
      setMySelectedInterfaceId(selection?.interfaceId ?? null);
      setMySelectionDraftId(selection?.interfaceId ?? null);
    } catch {
      setMySelectedInterfaceId(null);
      setMySelectionDraftId(null);
    } finally {
      setLoadingMySelection(false);
    }
  }, [evaluationId, token]);

  const onLoadMyAnswers = useCallback(
    async (interfaceId: number) => {
      setLoadingSavedAnswersInterfaceId(interfaceId);
      setActionError(null);
      try {
        const data = await apiRequest<{
          interfaceId: number;
          answers: Array<{
            questionId: number;
            valueLikert: number | null;
            valueNumber: number | null;
            valueBoolean: boolean | null;
            valueText: string | null;
          }>;
        }>(`/evaluations/${evaluationId}/answers?interfaceId=${interfaceId}`, {
          token: token ?? undefined,
        });

        const map: Record<number, unknown> = {};
        for (const a of data.answers) {
          if (a.valueLikert !== null) map[a.questionId] = a.valueLikert;
          else if (a.valueNumber !== null) map[a.questionId] = a.valueNumber;
          else if (a.valueBoolean !== null) map[a.questionId] = a.valueBoolean;
          else if (a.valueText !== null) map[a.questionId] = a.valueText;
        }

        setAnswersByInterface((s) => ({ ...s, [interfaceId]: map }));
        setSubmittedInterfaceIdMap((s) => ({ ...s, [interfaceId]: true }));

        const intf = (ev?.interfaces ?? []).find((i) => i.id === interfaceId) ?? null;
        if (intf) {
          const fp = answersFingerprint(intf.questions, map);
          setSavedAnswersFingerprintByInterfaceId((s) => ({ ...s, [interfaceId]: fp }));
        }
      } catch (e) {
        const apiErr = e as Partial<ApiError>;
        setActionError(apiErr.message ?? 'No se pudieron cargar tus respuestas guardadas');
      } finally {
        setLoadingSavedAnswersInterfaceId(null);
      }
    },
    [evaluationId, token, ev],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setActionError(null);
      void apiRequest<Evaluation>(`/evaluations/${evaluationId}`, {
        token: token ?? undefined,
      })
        .then((data) => {
          if (cancelled) return;
          setEv(data);
          setScoringWeightsDraft({
            effectiveness: String(data.scoringWeightEffectiveness),
            efficiency: String(data.scoringWeightEfficiency),
            satisfaction: String(data.scoringWeightSatisfaction),
          });
          void loadMySelection();
          setSelectedInterfaceId((current) => {
            if (current !== null && data.interfaces.some((i) => i.id === current)) return current;
            return data.interfaces[0]?.id ?? null;
          });
          setStep((current) => {
            const canManageLoaded =
              user?.role?.name === 'ADMIN' || (user ? data.createdById === user.id : false);

            if (!canManageLoaded) {
              return 'run';
            }

            if (current !== 'userStories' && current !== 'interfaces') return current;
            if (data.manualUserStories.length === 0) return 'userStories';
            if (data.interfaces.length === 0) return 'interfaces';
            const hasStructure = data.interfaces.some((i) => i.questions.length > 0);
            return hasStructure ? 'run' : 'structure';
          });
        })
        .catch((e) => {
          if (cancelled) return;
          const apiErr = e as Partial<ApiError>;
          setError(
            apiErr.status === 403
              ? 'No tienes permiso para ver esta evaluación.'
              : apiErr.message ?? 'No se pudo cargar la evaluación',
          );
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [evaluationId, token, user, loadMySelection]);

  useEvaluationDraftPersistence({
    draftKey,
    selectedInterfaceId,
    setSelectedInterfaceId,
    attemptDrafts,
    setAttemptDrafts,
    answersByInterface,
    setAnswersByInterface,
  });

  useEffect(() => {
    if (!ev) return;
    const interfaceIds = new Set(ev.interfaces.map((i) => i.id));
    queueMicrotask(() => {
      setMySelectionDraftId((current) => {
        if (current !== null && interfaceIds.has(current)) return current;
        return mySelectedInterfaceId !== null && interfaceIds.has(mySelectedInterfaceId)
          ? mySelectedInterfaceId
          : (ev.interfaces[0]?.id ?? null);
      });
    });
  }, [ev, mySelectedInterfaceId]);

  useEffect(() => {
    if (pendingScrollQuestionId === null) return;

    const effectiveViewStep: StepId = canManage ? step : step === 'results' ? 'results' : 'run';
    if (effectiveViewStep !== 'run') return;

    if (lastScrolledQuestionIdRef.current === pendingScrollQuestionId) return;
    lastScrolledQuestionIdRef.current = pendingScrollQuestionId;

    setTimeout(() => {
      const el = document.getElementById(`question-${pendingScrollQuestionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      questionnaireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }, [pendingScrollQuestionId, canManage, step]);


  const interfaces = useMemo(() => ev?.interfaces ?? [], [ev]);
  const interfaceById = useMemo(
    () => new Map<number, Interface>(interfaces.map((i) => [i.id, i])),
    [interfaces],
  );
  let activeInterface: Interface | null = null;
  if (selectedInterfaceId !== null) {
    activeInterface = interfaces.find((i) => i.id === selectedInterfaceId) ?? null;
  }
  if (!activeInterface) {
    activeInterface = interfaces[0] ?? null;
  }

  const activeInterfaceAnswers =
    activeInterface && answersByInterface[activeInterface.id]
      ? answersByInterface[activeInterface.id]
      : {};

  const runInterface =
    mySelectedInterfaceId !== null
      ? (interfaces.find((i) => i.id === mySelectedInterfaceId) ?? null)
      : null;

  const myDraftInterface =
    mySelectionDraftId !== null
      ? (interfaces.find((i) => i.id === mySelectionDraftId) ?? null)
      : null;

  const runUiInterface = myDraftInterface ?? runInterface;

  const runUiInterfaceAnswers =
    runUiInterface && answersByInterface[runUiInterface.id]
      ? answersByInterface[runUiInterface.id]
      : {};

  const questionnaireInterface = canSubmit ? runUiInterface : activeInterface;
  const questionnaireAnswers = canSubmit ? runUiInterfaceAnswers : activeInterfaceAnswers;

  const lockedInterfaceIds = useMemo(() => {
    const set = new Set<number>();
    for (const k of Object.keys(submittedInterfaceIdMap)) {
      const id = Number(k);
      if (Number.isFinite(id)) set.add(id);
    }
    for (const b of interfaceBreakdown?.breakdown ?? []) {
      if (b.totalAnswers > 0) set.add(b.interfaceId);
    }
    return set;
  }, [submittedInterfaceIdMap, interfaceBreakdown]);

  const activeInterfaceEdit = activeInterface
    ? (interfaceEdits[activeInterface.id] ?? {
        name: activeInterface.name,
        imageUrl: activeInterface.imageUrl ?? '',
        prototypeUrl: activeInterface.prototypeUrl ?? '',
      })
    : null;

  const manualUserStories = useMemo(() => ev?.manualUserStories ?? [], [ev]);

  const allSteps: Array<{ id: StepId; title: string; hint: string }> = [
    {
      id: 'userStories',
      title: '1) Historias de usuario',
      hint: 'Recolecta los requisitos (historias) antes de evaluar interfaces.',
    },
    { id: 'interfaces', title: '2) Interfaces', hint: 'Crea y selecciona pantallas a evaluar.' },
    { id: 'structure', title: '3) Estructura', hint: 'Define preguntas ISO 9241-11 por interfaz.' },
    { id: 'run', title: '4) Evaluación', hint: 'Selecciona una interfaz y responde el cuestionario.' },
    { id: 'results', title: '5) Resultados', hint: 'Calcula y descarga el reporte.' },
  ];

  const stepAvailability = useMemo(() => {
    const hasStories = manualUserStories.length > 0;
    const hasInterfaces = interfaces.length > 0;
    const hasQuestions = hasInterfaces && interfaces.some((i) => i.questions.length > 0);

    const base: Record<StepId, { enabled: boolean; reason: string | null }> = {
      userStories: { enabled: true, reason: null },
      interfaces: {
        enabled: hasStories,
        reason: hasStories ? null : 'Primero agrega al menos una historia de usuario.',
      },
      structure: {
        enabled: hasStories && hasInterfaces,
        reason: !hasStories
          ? 'Primero agrega al menos una historia de usuario.'
          : !hasInterfaces
            ? 'Primero agrega al menos una interfaz.'
            : null,
      },
      run: {
        enabled: hasStories && hasInterfaces && hasQuestions,
        reason: !hasStories
          ? 'Primero agrega al menos una historia de usuario.'
          : !hasInterfaces
            ? 'Primero agrega al menos una interfaz.'
            : !hasQuestions
              ? 'Primero agrega al menos una pregunta en “Estructura”.'
              : null,
      },
      results: {
        enabled: hasStories && hasInterfaces && hasQuestions,
        reason: !hasStories
          ? 'Primero agrega al menos una historia de usuario.'
          : !hasInterfaces
            ? 'Primero agrega al menos una interfaz.'
            : !hasQuestions
              ? 'Primero agrega al menos una pregunta en “Estructura”.'
              : null,
      },
    };

    return base;
  }, [manualUserStories, interfaces]);

  function canGoToStep(target: StepId) {
    return stepAvailability[target].enabled;
  }

  async function refreshEvaluation() {
    const data = await apiRequest<Evaluation>(`/evaluations/${evaluationId}`, {
      token: token ?? undefined,
    });
    setEv(data);
    setScoringWeightsDraft({
      effectiveness: String(data.scoringWeightEffectiveness),
      efficiency: String(data.scoringWeightEfficiency),
      satisfaction: String(data.scoringWeightSatisfaction),
    });
    await loadMySelection();
    setResultsBreakdown(null);
    setCompleteness(null);
    setSelectedInterfaceId((current) => {
      if (current !== null && data.interfaces.some((i) => i.id === current)) return current;
      return data.interfaces[0]?.id ?? null;
    });
  }

  async function onSaveInterface() {
    if (!activeInterface) return;
    const edit = interfaceEdits[activeInterface.id] ?? {
      name: activeInterface.name,
      imageUrl: activeInterface.imageUrl ?? '',
      prototypeUrl: activeInterface.prototypeUrl ?? '',
    };
    setSavingInterface(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/interfaces/${activeInterface.id}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({
          name: edit.name,
          imageUrl: edit.imageUrl,
          prototypeUrl: edit.prototypeUrl,
        }),
      });
      setInterfaceEdits((s) => {
        const next = { ...s };
        delete next[activeInterface.id];
        return next;
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo guardar la interfaz');
    } finally {
      setSavingInterface(false);
    }
  }

  async function onMoveInterface(direction: 'up' | 'down') {
    if (!activeInterface) return;
    const idx = interfaces.findIndex((i) => i.id === activeInterface.id);
    const other = interfaces[idx + (direction === 'up' ? -1 : 1)] ?? null;
    if (!other) return;
    setSavingInterface(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/interfaces/${activeInterface.id}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ order: other.order }),
      });
      await refreshEvaluation();
      setSelectedInterfaceId(activeInterface.id);
    } catch {
      setActionError('No se pudo reordenar la interfaz');
    } finally {
      setSavingInterface(false);
    }
  }

  async function onDeleteInterface() {
    if (!activeInterface) return;
    if (
      !window.confirm(
        `Eliminar la interfaz “${activeInterface.name}”? Esto eliminará sus tareas y preguntas.`,
      )
    )
      return;
    setSavingInterface(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/interfaces/${activeInterface.id}`, {
        method: 'DELETE',
        token: token ?? undefined,
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo eliminar la interfaz');
    } finally {
      setSavingInterface(false);
    }
  }

  async function onAddInterface(e: FormEvent) {
    e.preventDefault();
    setAddingInterface(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/${evaluationId}/interfaces`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          name: interfaceName,
          imageUrl: interfaceImageUrl.trim() ? interfaceImageUrl.trim() : undefined,
          prototypeUrl: interfacePrototypeUrl.trim() ? interfacePrototypeUrl.trim() : undefined,
        }),
      });
      setInterfaceName('');
      setInterfaceImageUrl('');
      setInterfacePrototypeUrl('');
      setInterfaceImageFileError(null);
      await refreshEvaluation();
      setStep('structure');
    } catch {
      setActionError('No se pudo agregar la interfaz');
    } finally {
      setAddingInterface(false);
    }
  }

  async function onApplyIsoTemplate() {
    if (interfaces.length === 0) return;
    setAddingTemplate(true);
    try {
      const templates: Array<{
        dimension: Question['dimension'];
        type: Question['type'];
        prompt: string;
        helpText?: string;
      }> = [
        {
          dimension: 'EFFECTIVENESS',
          type: 'LIKERT_1_5',
          prompt: 'Pude completar mi objetivo principal sin problemas.',
        },
        {
          dimension: 'EFFECTIVENESS',
          type: 'LIKERT_1_5',
          prompt: 'Las opciones y etiquetas fueron claras para lograr mi objetivo.',
        },
        {
          dimension: 'EFFECTIVENESS',
          type: 'LIKERT_1_5',
          prompt: 'Me sentí seguro/a de que estaba haciendo lo correcto en cada paso.',
        },
        {
          dimension: 'EFFICIENCY',
          type: 'LIKERT_1_5',
          prompt: 'Completé mi objetivo con un esfuerzo razonable.',
        },
        {
          dimension: 'EFFICIENCY',
          type: 'LIKERT_1_5',
          prompt: 'La cantidad de pasos necesarios fue adecuada.',
        },
        {
          dimension: 'EFFICIENCY',
          type: 'LIKERT_1_5',
          prompt: 'Encontré rápidamente la información o acción que necesitaba.',
        },
        {
          dimension: 'SATISFACTION',
          type: 'LIKERT_1_5',
          prompt: 'La experiencia general al usar esta pantalla fue satisfactoria.',
        },
        {
          dimension: 'SATISFACTION',
          type: 'LIKERT_1_5',
          prompt: 'El diseño visual y la jerarquía de la información fueron agradables.',
        },
        {
          dimension: 'SATISFACTION',
          type: 'LIKERT_1_5',
          prompt: 'Recomendaría esta experiencia a otras personas.',
        },
      ];

      for (const intf of interfaces) {
        for (const q of templates) {
          await apiRequest(`/evaluations/interfaces/${intf.id}/questions`, {
            method: 'POST',
            token: token ?? undefined,
            body: JSON.stringify({
              dimension: q.dimension,
              type: q.type,
              prompt: q.prompt,
              helpText: q.helpText,
              isRequired: true,
              weight: 1,
            }),
          });
        }
      }
      await refreshEvaluation();
    } finally {
      setAddingTemplate(false);
    }
  }

  async function onCreateManualStory(e: FormEvent) {
    e.preventDefault();
    setActionError(null);
    if (!manualStoryDraft.status || !manualStoryDraft.mosCow) {
      setActionError('Completa los campos Estado y Prioridad MoSCoW.');
      return;
    }
    if (!manualStoryDraft.priority.trim()) {
      setActionError('Completa el campo Prioridad (1-5).');
      return;
    }
    const payload = {
      title: manualStoryDraft.title,
      narrative: manualStoryDraft.narrative,
      acceptanceCriteria: manualStoryDraft.acceptanceCriteria,
      status: manualStoryDraft.status,
      mosCow: manualStoryDraft.mosCow,
      priority: Number(manualStoryDraft.priority),
      riceReach: manualStoryDraft.riceReach.trim() ? Number(manualStoryDraft.riceReach) : undefined,
      riceImpact: manualStoryDraft.riceImpact.trim() ? Number(manualStoryDraft.riceImpact) : undefined,
      riceConfidence: manualStoryDraft.riceConfidence.trim()
        ? Number(manualStoryDraft.riceConfidence)
        : undefined,
      riceEffort: manualStoryDraft.riceEffort.trim() ? Number(manualStoryDraft.riceEffort) : undefined,
    };
    await apiRequest(`/evaluations/${evaluationId}/manual-user-stories`, {
      method: 'POST',
      token: token ?? undefined,
      body: JSON.stringify(payload),
    });
    setManualStoryDraft({
      interfaceId: null,
      recommendedInterfaceId: null,
      title: '',
      narrative: '',
      acceptanceCriteria: '',
      status: '',
      mosCow: '',
      priority: '',
      riceReach: '',
      riceImpact: '',
      riceConfidence: '',
      riceEffort: '',
    });
    await refreshEvaluation();
  }

  async function onSaveManualStory(storyId: number) {
    const edit = manualStoryEdits[storyId];
    if (!edit) return;
    const payload: Record<string, unknown> = {};
    if (edit.interfaceId !== undefined) payload.interfaceId = edit.interfaceId;
    if (edit.recommendedInterfaceId !== undefined)
      payload.recommendedInterfaceId = edit.recommendedInterfaceId;
    if (edit.title !== undefined) payload.title = edit.title;
    if (edit.narrative !== undefined) payload.narrative = edit.narrative;
    if (edit.acceptanceCriteria !== undefined) payload.acceptanceCriteria = edit.acceptanceCriteria;
    if (edit.status !== undefined) payload.status = edit.status;
    if (edit.mosCow !== undefined) payload.mosCow = edit.mosCow;
    if (edit.priority !== undefined) payload.priority = Number(edit.priority);
    if (edit.riceReach !== undefined)
      payload.riceReach = edit.riceReach.trim() ? Number(edit.riceReach) : null;
    if (edit.riceImpact !== undefined)
      payload.riceImpact = edit.riceImpact.trim() ? Number(edit.riceImpact) : null;
    if (edit.riceConfidence !== undefined)
      payload.riceConfidence = edit.riceConfidence.trim() ? Number(edit.riceConfidence) : null;
    if (edit.riceEffort !== undefined)
      payload.riceEffort = edit.riceEffort.trim() ? Number(edit.riceEffort) : null;

    await apiRequest(`/evaluations/${evaluationId}/manual-user-stories/${storyId}`, {
      method: 'PATCH',
      token: token ?? undefined,
      body: JSON.stringify(payload),
    });
    setManualStoryEdits((s) => {
      const next = { ...s };
      delete next[storyId];
      return next;
    });
    await refreshEvaluation();
  }

  async function onLinkStoryToActiveInterface(storyId: number) {
    if (!activeInterface) return;
    setActionError(null);
    setLinkingManualStoryId(storyId);
    try {
      await apiRequest(`/evaluations/${evaluationId}/manual-user-stories/${storyId}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ interfaceId: activeInterface.id }),
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo vincular la historia a la interfaz.');
    } finally {
      setLinkingManualStoryId(null);
    }
  }

  async function onSetStoryRecommendedInterface(storyId: number, recommendedInterfaceId: number | null) {
    setActionError(null);
    setSavingManualStoryRecommendedId(storyId);
    try {
      await apiRequest(`/evaluations/${evaluationId}/manual-user-stories/${storyId}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ recommendedInterfaceId }),
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo guardar la interfaz recomendada.');
    } finally {
      setSavingManualStoryRecommendedId(null);
    }
  }

  async function onDeleteManualStory(storyId: number) {
    await apiRequest(`/evaluations/${evaluationId}/manual-user-stories/${storyId}`, {
      method: 'DELETE',
      token: token ?? undefined,
    });
    await refreshEvaluation();
  }

  async function onAssignEvaluator(e: FormEvent) {
    e.preventDefault();
    if (!assignEmail.trim()) return;
    setAssigning(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/${evaluationId}/evaluators`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ email: assignEmail }),
      });
      setAssignEmail('');
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo asignar el evaluador');
    } finally {
      setAssigning(false);
    }
  }

  async function onRemoveEvaluator(evaluatorId: number) {
    if (!window.confirm('Quitar este evaluador de la evaluación?')) return;
    setActionError(null);
    try {
      await apiRequest(`/evaluations/${evaluationId}/evaluators/${evaluatorId}`, {
        method: 'DELETE',
        token: token ?? undefined,
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo quitar el evaluador');
    }
  }

  async function onStartSession() {
    if (!canSubmit) {
      setActionError('Solo un evaluador asignado puede registrar sesiones, intentos y respuestas.');
      return;
    }
    setSessionWorking(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/${evaluationId}/sessions/start`, {
        method: 'POST',
        token: token ?? undefined,
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo iniciar la sesión');
    } finally {
      setSessionWorking(false);
    }
  }

  async function onEndSession() {
    if (!canSubmit) {
      setActionError('Solo un evaluador asignado puede registrar sesiones, intentos y respuestas.');
      return;
    }
    setSessionWorking(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/${evaluationId}/sessions/end`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ notes: sessionNotes.trim() ? sessionNotes.trim() : undefined }),
      });
      setSessionNotes('');
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo finalizar la sesión');
    } finally {
      setSessionWorking(false);
    }
  }

  async function onPrintReport() {
    type ReportTaskAttempt = {
      completed: boolean;
      errorsCount: number;
      timeSec: number | null;
      stepsCount: number | null;
      notes: string | null;
      createdAt: string;
    };

    type ReportTask = {
      id: number;
      title: string;
      description: string | null;
      order: number;
      targetTimeSec: number | null;
      targetSteps: number | null;
      attempts: ReportTaskAttempt[];
    };

    type ReportQuestion = {
      id: number;
      dimension: Question['dimension'];
      type: Question['type'];
      prompt: string;
      helpText: string | null;
      isRequired: boolean;
      weight: number;
    };

    type ReportInterface = {
      id: number;
      name: string;
      order: number;
      imageUrl: string | null;
      prototypeUrl: string | null;
      tasks: ReportTask[];
      questions: ReportQuestion[];
    };

    type ReportSession = {
      id: number;
      status: 'IN_PROGRESS' | 'COMPLETED';
      startedAt: string;
      endedAt: string | null;
      notes: string | null;
      evaluator?: Person;
    };

    type Report = {
      generatedAt: string;
      evaluation: {
        id: number;
        title: string;
        systemName: string;
        userType: Evaluation['userType'];
        usageContext: string;
        scoringWeightEffectiveness: number;
        scoringWeightEfficiency: number;
        scoringWeightSatisfaction: number;
        status: Evaluation['status'];
      };
      interfaces: ReportInterface[];
      evaluators?: EvaluationEvaluator[];
      sessions?: ReportSession[];
      manualUserStories?: ManualUserStory[];
      result: Result | null;
    };

    const report = await apiRequest<Report>(`/evaluations/${evaluationId}/report`, {
      token: token ?? undefined,
    });

    const fmtDateTime = (value: string | null | undefined) => {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleString();
    };

    const fmtUserType = (v: Evaluation['userType']) => (v === 'NOVICE' ? 'Novato' : 'Experto');
    const fmtEvaluationStatus = (v: Evaluation['status']) => {
      if (v === 'DRAFT') return 'Borrador';
      if (v === 'IN_PROGRESS') return 'En progreso';
      if (v === 'COMPLETED') return 'Completada';
      return v;
    };

    const fmtDimension = (v: Question['dimension']) => {
      if (v === 'EFFECTIVENESS') return 'Efectividad';
      if (v === 'EFFICIENCY') return 'Eficiencia';
      if (v === 'SATISFACTION') return 'Satisfacción';
      return v;
    };

    const fmtQuestionType = (v: Question['type']) => {
      if (v === 'LIKERT_1_5') return 'Likert 1–5';
      if (v === 'NUMBER') return 'Número';
      if (v === 'BOOLEAN') return 'Sí/No';
      if (v === 'TEXT') return 'Texto';
      return v;
    };

    const fmtStoryStatus = (v: ManualUserStory['status']) => {
      if (v === 'DRAFT') return 'Borrador';
      if (v === 'APPROVED') return 'Aprobada';
      if (v === 'DONE') return 'Hecha';
      return v;
    };

    const escapeHtml = (text: string) => {
      return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    };

    const escapeAttr = (text: string) => escapeHtml(text).replaceAll('\n', '&#10;');

    const computeTaskSummary = (t: ReportTask) => {
      const attempts = t.attempts;
      const count = attempts.length;
      const completionRate =
        count === 0 ? null : attempts.filter((a) => a.completed).length / count;
      const avgErrors =
        count === 0
          ? null
          : attempts.reduce((acc, a) => acc + (a.errorsCount ?? 0), 0) / count;

      const timeValues = attempts.map((a) => a.timeSec).filter((x): x is number => x !== null);
      const avgTimeSec =
        timeValues.length === 0
          ? null
          : timeValues.reduce((acc, n) => acc + n, 0) / timeValues.length;

      const stepValues = attempts
        .map((a) => a.stepsCount)
        .filter((x): x is number => x !== null);
      const avgSteps =
        stepValues.length === 0
          ? null
          : stepValues.reduce((acc, n) => acc + n, 0) / stepValues.length;

      return { count, completionRate, avgErrors, avgTimeSec, avgSteps };
    };

    const interfacesHtml = report.interfaces
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((intf) => {
        const imageHtml = intf.imageUrl
          ? `<div class="imgWrap"><img class="img" src="${escapeAttr(intf.imageUrl)}" alt="${escapeAttr(intf.name)}" /></div>`
          : `<div class="muted">Sin imagen</div>`;
        const prototypeHtml = intf.prototypeUrl
          ? `<a href="${escapeAttr(intf.prototypeUrl)}" target="_blank" rel="noreferrer">${escapeHtml(intf.prototypeUrl)}</a>`
          : `<div class="muted">Sin prototipo</div>`;

        const tasksHtml =
          intf.tasks.length === 0
            ? `<div class="muted">Sin tareas</div>`
            : `<table class="table">
  <thead>
    <tr>
      <th>Tarea</th>
      <th>Intentos</th>
      <th>Completado</th>
      <th>Errores prom.</th>
      <th>Tiempo prom.</th>
      <th>Pasos prom.</th>
    </tr>
  </thead>
  <tbody>
    ${intf.tasks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((t) => {
        const s = computeTaskSummary(t);
        const completionTxt =
          s.completionRate === null ? '—' : `${Math.round(s.completionRate * 100)}%`;
        const errorsTxt = s.avgErrors === null ? '—' : String(Math.round(s.avgErrors * 10) / 10);
        const timeTxt = s.avgTimeSec === null ? '—' : `${Math.round(s.avgTimeSec)}s`;
        const stepsTxt = s.avgSteps === null ? '—' : String(Math.round(s.avgSteps));
        const title = escapeHtml(t.title);
        const desc = t.description ? `<div class="muted small">${escapeHtml(t.description)}</div>` : '';
        const target = [
          t.targetTimeSec ? `Tiempo objetivo: ${t.targetTimeSec}s` : null,
          t.targetSteps ? `Pasos objetivo: ${t.targetSteps}` : null,
        ]
          .filter((x): x is string => Boolean(x))
          .join(' · ');
        const targetHtml = target ? `<div class="muted small">${escapeHtml(target)}</div>` : '';
        return `<tr>
  <td>
    <div class="strong">${title}</div>
    ${desc}
    ${targetHtml}
  </td>
  <td>${s.count}</td>
  <td>${completionTxt}</td>
  <td>${errorsTxt}</td>
  <td>${timeTxt}</td>
  <td>${stepsTxt}</td>
</tr>`;
      })
      .join('\n')}
  </tbody>
</table>`;

        const questionsHtml =
          intf.questions.length === 0
            ? `<div class="muted">Sin preguntas</div>`
            : `<table class="table">
  <thead>
    <tr>
      <th>Pregunta</th>
      <th>Dimensión</th>
      <th>Tipo</th>
      <th>Oblig.</th>
    </tr>
  </thead>
  <tbody>
    ${intf.questions
      .map((q) => {
        const help = q.helpText ? `<div class="muted small">${escapeHtml(q.helpText)}</div>` : '';
        return `<tr>
  <td>
    <div class="strong">${escapeHtml(q.prompt)}</div>
    ${help}
  </td>
  <td>${escapeHtml(fmtDimension(q.dimension))}</td>
  <td>${escapeHtml(fmtQuestionType(q.type))}</td>
  <td>${q.isRequired ? 'Sí' : 'No'}</td>
</tr>`;
      })
      .join('\n')}
  </tbody>
</table>`;

        return `<section class="section">
  <h3>Interfaz ${intf.order + 1}: ${escapeHtml(intf.name)}</h3>
  <div class="grid2">
    <div class="card">
      <div class="cardTitle">Evidencia (imagen)</div>
      ${imageHtml}
    </div>
    <div class="card">
      <div class="cardTitle">Resumen</div>
      <div class="kpis">
        <div class="kpi"><div class="kpiLabel">Tareas</div><div class="kpiValue">${intf.tasks.length}</div></div>
        <div class="kpi"><div class="kpiLabel">Preguntas</div><div class="kpiValue">${intf.questions.length}</div></div>
      </div>
      <div class="block">
        <div class="label">Prototipo</div>
        <div class="pre">${prototypeHtml}</div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="cardTitle">Tareas</div>
    ${tasksHtml}
  </div>
  <div class="card">
    <div class="cardTitle">Preguntas</div>
    ${questionsHtml}
  </div>
</section>`;
      })
      .join('\n');

    const interfaceNameById = new Map<number, string>();
    for (const i of report.interfaces) interfaceNameById.set(i.id, i.name);

    const manualStories = report.manualUserStories ?? [];
    const manualStoriesHtml =
      manualStories.length === 0
        ? `<div class="muted">Sin historias manuales</div>`
        : `<div class="stack">
  ${manualStories
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((s) => {
      const tags = [
        `P${s.priority}`,
        fmtStoryStatus(s.status),
        fmtMosCow(s.mosCow),
        s.interface?.name ? `Interfaz: ${s.interface.name}` : null,
        s.recommendedInterface?.name
          ? `Recomendada: ${s.recommendedInterface.name}`
          : s.recommendedInterfaceId
            ? `Recomendada: ${interfaceNameById.get(s.recommendedInterfaceId) ?? s.recommendedInterfaceId}`
            : null,
      ]
        .filter((x): x is string => Boolean(x))
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join('');

      const rice = [
        s.riceReach !== null ? `Reach: ${s.riceReach}` : null,
        s.riceImpact !== null ? `Impact: ${s.riceImpact}` : null,
        s.riceConfidence !== null ? `Confidence: ${s.riceConfidence}` : null,
        s.riceEffort !== null ? `Effort: ${s.riceEffort}` : null,
      ]
        .filter((x): x is string => Boolean(x))
        .join(' · ');

      return `<div class="card">
  <div class="tags">${tags}</div>
  <div class="h">${escapeHtml(s.title)}</div>
  <div class="muted small">Por ${escapeHtml(s.createdBy.fullName)} · ${fmtDateTime(s.createdAt)}</div>
  <div class="block">
    <div class="label">Narrativa</div>
    <div class="pre">${escapeHtml(s.narrative)}</div>
  </div>
  <div class="block">
    <div class="label">Criterios de aceptación</div>
    <div class="pre">${escapeHtml(s.acceptanceCriteria)}</div>
  </div>
  ${rice ? `<div class="muted small">RICE · ${escapeHtml(rice)}</div>` : ''}
</div>`;
    })
    .join('\n')}
</div>`;

    const generatedStories = report.result?.userStories ?? [];
    const generatedStoriesHtml =
      generatedStories.length === 0
        ? `<div class="muted">Sin historias generadas</div>`
        : `<div class="stack">
  ${generatedStories
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map(
      (s) => `<div class="card">
  <div class="tags">
    <span class="tag">P${s.priority}</span>
    ${
      s.recommendedInterface?.name
        ? `<span class="tag">${escapeHtml(`Recomendada: ${s.recommendedInterface.name}`)}</span>`
        : s.recommendedInterfaceId
          ? `<span class="tag">${escapeHtml(`Recomendada: ${interfaceNameById.get(s.recommendedInterfaceId) ?? s.recommendedInterfaceId}`)}</span>`
          : ''
    }
  </div>
  <div class="h">${escapeHtml(s.title)}</div>
  <div class="block">
    <div class="label">Narrativa</div>
    <div class="pre">${escapeHtml(s.narrative)}</div>
  </div>
  <div class="block">
    <div class="label">Criterios de aceptación</div>
    <div class="pre">${escapeHtml(s.acceptanceCriteria)}</div>
  </div>
</div>`,
    )
    .join('\n')}
</div>`;

    const evaluators = report.evaluators ?? [];
    const evaluatorsHtml =
      evaluators.length === 0
        ? `<div class="muted">Sin evaluadores asignados</div>`
        : `<table class="table">
  <thead><tr><th>Nombre</th><th>Email</th><th>Asignado</th></tr></thead>
  <tbody>
    ${evaluators
      .map(
        (e) => `<tr>
  <td>${escapeHtml(e.evaluator.fullName)}</td>
  <td>${escapeHtml(e.evaluator.email)}</td>
  <td>${fmtDateTime(e.createdAt)}</td>
</tr>`,
      )
      .join('\n')}
  </tbody>
</table>`;

    const sessions = report.sessions ?? [];
    const sessionsHtml =
      sessions.length === 0
        ? `<div class="muted">Sin sesiones</div>`
        : `<table class="table">
  <thead><tr><th>Evaluador</th><th>Estado</th><th>Inicio</th><th>Fin</th><th>Notas</th></tr></thead>
  <tbody>
    ${sessions
      .map((s) => {
        const evaluatorName = s.evaluator?.fullName ?? '—';
        const statusTxt = s.status === 'IN_PROGRESS' ? 'Activa' : 'Finalizada';
        const notes = s.notes ? escapeHtml(s.notes) : '—';
        return `<tr>
  <td>${escapeHtml(evaluatorName)}</td>
  <td>${escapeHtml(statusTxt)}</td>
  <td>${escapeHtml(fmtDateTime(s.startedAt))}</td>
  <td>${escapeHtml(fmtDateTime(s.endedAt))}</td>
  <td>${notes}</td>
</tr>`;
      })
      .join('\n')}
  </tbody>
</table>`;

    const kpisHtml = report.result
      ? `<div class="kpis">
  <div class="kpi">
    <div class="kpiLabel">Efectividad</div>
    <div class="kpiValue">${escapeHtml(percent(report.result.effectivenessScore))}</div>
  </div>
  <div class="kpi">
    <div class="kpiLabel">Eficiencia</div>
    <div class="kpiValue">${escapeHtml(percent(report.result.efficiencyScore))}</div>
  </div>
  <div class="kpi">
    <div class="kpiLabel">Satisfacción</div>
    <div class="kpiValue">${escapeHtml(percent(report.result.satisfactionScore))}</div>
  </div>
  <div class="kpi">
    <div class="kpiLabel">Global</div>
    <div class="kpiValue">${escapeHtml(percent(report.result.overallScore))}</div>
  </div>
</div>`
      : `<div class="muted">Aún no hay resultados calculados.</div>`;

    const conclusionsHtml = report.result?.conclusions
      ? `<div class="pre">${escapeHtml(report.result.conclusions)}</div>`
      : `<div class="muted">—</div>`;

    const recommendationsHtml = report.result?.recommendations
      ? `<div class="pre">${escapeHtml(report.result.recommendations)}</div>`
      : `<div class="muted">—</div>`;

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Reporte evaluación ${evaluationId}</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 18px; color: #111; }
  h1 { margin: 0 0 6px; font-size: 22px; }
  h2 { margin: 0 0 10px; font-size: 16px; }
  h3 { margin: 0 0 10px; font-size: 14px; }
  .muted { color: #666; }
  .small { font-size: 12px; }
  .strong { font-weight: 700; }
  .stack { display: grid; gap: 12px; }
  .section { margin-top: 14px; page-break-inside: avoid; }
  .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
  .cardTitle { font-weight: 700; margin-bottom: 8px; }
  .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
  .kpiLabel { font-size: 12px; color: #666; }
  .kpiValue { font-size: 18px; font-weight: 800; margin-top: 4px; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .tag { border: 1px solid #ddd; border-radius: 999px; padding: 2px 8px; font-size: 12px; color: #333; }
  .h { font-weight: 800; font-size: 14px; margin: 4px 0 8px; }
  .pre { white-space: pre-wrap; word-break: break-word; background: #f6f7f8; padding: 10px; border-radius: 8px; }
  .label { font-size: 12px; color: #666; margin-bottom: 4px; }
  .block { margin-top: 10px; }
  .table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .table th { text-align: left; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 8px; }
  .table td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
  .imgWrap { width: 100%; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #fff; }
  .img { display: block; width: 100%; height: auto; }
  .hr { height: 1px; background: #e5e7eb; margin: 12px 0; }
  @media print { body { padding: 0; } .noPrint { display: none; } }
</style>
</head>
<body>
  <div class="noPrint muted">Usa Ctrl+P para imprimir o guardar como PDF.</div>
  <h1>Reporte de evaluación</h1>
  <div class="muted small">Generado: ${escapeHtml(fmtDateTime(report.generatedAt))}</div>

  <div class="hr"></div>

  <section class="section">
    <h2>Información general</h2>
    <div class="grid2">
      <div class="card">
        <div class="cardTitle">Evaluación</div>
        <div><span class="strong">Título:</span> ${escapeHtml(report.evaluation.title)}</div>
        <div><span class="strong">Sistema:</span> ${escapeHtml(report.evaluation.systemName)}</div>
        <div><span class="strong">Tipo de usuario:</span> ${escapeHtml(fmtUserType(report.evaluation.userType))}</div>
        <div><span class="strong">Estado:</span> ${escapeHtml(fmtEvaluationStatus(report.evaluation.status))}</div>
        <div class="block">
          <div class="label">Pesos de scoring</div>
          <div class="pre">Efectividad: ${escapeHtml(String(report.evaluation.scoringWeightEffectiveness))} · Eficiencia: ${escapeHtml(String(report.evaluation.scoringWeightEfficiency))} · Satisfacción: ${escapeHtml(String(report.evaluation.scoringWeightSatisfaction))}</div>
        </div>
      </div>
      <div class="card">
        <div class="cardTitle">Contexto de uso</div>
        <div class="pre">${escapeHtml(report.evaluation.usageContext || '—')}</div>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Métricas ISO 9241-11</h2>
    ${kpisHtml}
    <div class="grid2" style="margin-top: 12px;">
      <div class="card">
        <div class="cardTitle">Conclusiones</div>
        ${conclusionsHtml}
      </div>
      <div class="card">
        <div class="cardTitle">Recomendaciones</div>
        ${recommendationsHtml}
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Historias de usuario</h2>
    <div class="grid2">
      <div class="card">
        <div class="cardTitle">Historias manuales</div>
        ${manualStoriesHtml}
      </div>
      <div class="card">
        <div class="cardTitle">Historias generadas</div>
        ${generatedStoriesHtml}
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Interfases y evidencia</h2>
    ${interfacesHtml}
  </section>

  <section class="section">
    <h2>Evaluadores y sesiones</h2>
    <div class="grid2">
      <div class="card">
        <div class="cardTitle">Evaluadores asignados</div>
        ${evaluatorsHtml}
      </div>
      <div class="card">
        <div class="cardTitle">Sesiones</div>
        ${sessionsHtml}
      </div>
    </div>
  </section>
</body>
</html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.srcdoc = html;
    document.body.appendChild(iframe);

    const cleanup = () => {
      iframe.remove();
    };

    iframe.onload = () => {
      const w = iframe.contentWindow;
      if (!w) {
        cleanup();
        return;
      }
      try {
        w.focus();
        w.print();
      } finally {
        setTimeout(() => {
          cleanup();
        }, 1000);
      }
    };
  }

  async function onAddQuestion(e: FormEvent) {
    e.preventDefault();
    if (!activeInterface) return;
    setActionError(null);
    if (!questionDimension || !questionType || !questionIsRequired) {
      setActionError('Completa los campos Dimensión, Tipo y Obligatoria.');
      return;
    }
    try {
      await apiRequest(`/evaluations/interfaces/${activeInterface.id}/questions`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          dimension: questionDimension,
          type: questionType,
          prompt: questionPrompt,
          helpText: questionHelpText.trim() ? questionHelpText.trim() : undefined,
          isRequired: questionIsRequired === 'true',
          weight: questionWeight.trim() ? Number(questionWeight) : 1,
        }),
      });
      setQuestionPrompt('');
      setQuestionHelpText('');
      setQuestionDimension('');
      setQuestionType('');
      setQuestionIsRequired('');
      setQuestionWeight('');
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo agregar la pregunta');
    }
  }

  function startEditQuestion(q: Question) {
    setQuestionEdits((s) => ({
      ...s,
      [q.id]: {
        dimension: q.dimension,
        type: q.type,
        prompt: q.prompt,
        helpText: q.helpText ?? '',
        isRequired: q.isRequired,
        weight: String(q.weight),
      },
    }));
    setEditingQuestionId(q.id);
  }

  async function onSaveQuestion(questionId: number) {
    const edit = questionEdits[questionId];
    if (!edit) return;
    setQuestionWorkingId(questionId);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/questions/${questionId}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({
          dimension: edit.dimension,
          type: edit.type,
          prompt: edit.prompt,
          helpText: edit.helpText,
          isRequired: edit.isRequired,
          weight: edit.weight.trim() ? Number(edit.weight) : undefined,
        }),
      });
      setEditingQuestionId(null);
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo guardar la pregunta');
    } finally {
      setQuestionWorkingId(null);
    }
  }

  async function onMoveQuestion(questionId: number, direction: 'up' | 'down') {
    if (!activeInterface) return;
    const idx = activeInterface.questions.findIndex((q) => q.id === questionId);
    const other = activeInterface.questions[idx + (direction === 'up' ? -1 : 1)] ?? null;
    if (!other) return;
    setQuestionWorkingId(questionId);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/questions/${questionId}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ order: other.order }),
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo reordenar la pregunta');
    } finally {
      setQuestionWorkingId(null);
    }
  }

  async function onDeleteQuestion(q: Question) {
    if (!window.confirm(`Eliminar la pregunta “${q.prompt}”?`)) return;
    setQuestionWorkingId(q.id);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/questions/${q.id}`, {
        method: 'DELETE',
        token: token ?? undefined,
      });
      if (editingQuestionId === q.id) setEditingQuestionId(null);
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo eliminar la pregunta');
    } finally {
      setQuestionWorkingId(null);
    }
  }

  async function onAddTask(e: FormEvent) {
    e.preventDefault();
    if (!activeInterface) return;
    setAddingTask(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/interfaces/${activeInterface.id}/tasks`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription.trim() ? taskDescription.trim() : undefined,
          targetTimeSec: taskTargetTimeSec.trim()
            ? Number(taskTargetTimeSec)
            : undefined,
          targetSteps: taskTargetSteps.trim() ? Number(taskTargetSteps) : undefined,
        }),
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskTargetTimeSec('');
      setTaskTargetSteps('');
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo agregar la tarea');
    } finally {
      setAddingTask(false);
    }
  }

  function startEditTask(task: Task) {
    setTaskEdits((s) => ({
      ...s,
      [task.id]: {
        title: task.title,
        description: task.description ?? '',
        targetTimeSec: task.targetTimeSec ? String(task.targetTimeSec) : '',
        targetSteps: task.targetSteps ? String(task.targetSteps) : '',
      },
    }));
    setEditingTaskId(task.id);
  }

  async function onSaveTask(taskId: number) {
    const edit = taskEdits[taskId];
    if (!edit) return;
    setTaskWorkingId(taskId);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/tasks/${taskId}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({
          title: edit.title,
          description: edit.description,
          targetTimeSec: edit.targetTimeSec.trim() ? Number(edit.targetTimeSec) : undefined,
          targetSteps: edit.targetSteps.trim() ? Number(edit.targetSteps) : undefined,
        }),
      });
      setEditingTaskId(null);
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo guardar la tarea');
    } finally {
      setTaskWorkingId(null);
    }
  }

  async function onMoveTask(taskId: number, direction: 'up' | 'down') {
    if (!activeInterface) return;
    const idx = activeInterface.tasks.findIndex((t) => t.id === taskId);
    const other = activeInterface.tasks[idx + (direction === 'up' ? -1 : 1)] ?? null;
    if (!other) return;
    setTaskWorkingId(taskId);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/tasks/${taskId}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ order: other.order }),
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo reordenar la tarea');
    } finally {
      setTaskWorkingId(null);
    }
  }

  async function onDeleteTask(task: Task) {
    if (!window.confirm(`Eliminar la tarea “${task.title}”? Esto eliminará sus intentos.`)) return;
    setTaskWorkingId(task.id);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/tasks/${task.id}`, {
        method: 'DELETE',
        token: token ?? undefined,
      });
      if (editingTaskId === task.id) setEditingTaskId(null);
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo eliminar la tarea');
    } finally {
      setTaskWorkingId(null);
    }
  }

  async function onSaveTaskAttempt(task: Task) {
    if (!canSubmit) {
      setActionError('Solo un evaluador asignado puede registrar sesiones, intentos y respuestas.');
      return;
    }
    const attempt = task.attempts[0] ?? null;
    const draft = attemptDrafts[task.id];
    const completedRaw =
      draft?.completed ??
      (attempt ? (attempt.completed ? 'true' : 'false') : '');

    if (completedRaw !== 'true' && completedRaw !== 'false') {
      setActionError('Selecciona si la tarea fue completada (Sí/No)');
      return;
    }

    const errorsCountRaw = draft?.errorsCount ?? (attempt ? String(attempt.errorsCount) : '');
    const timeSecRaw = draft?.timeSec ?? (attempt?.timeSec !== null && attempt?.timeSec !== undefined ? String(attempt.timeSec) : '');
    const stepsCountRaw = draft?.stepsCount ?? (attempt?.stepsCount !== null && attempt?.stepsCount !== undefined ? String(attempt.stepsCount) : '');
    const notesRaw = draft?.notes ?? (attempt?.notes ?? '');

    if (completedRaw === 'true' && task.targetTimeSec && !timeSecRaw.trim()) {
      setActionError('Falta el tiempo (esta tarea tiene tiempo objetivo).');
      return;
    }

    if (completedRaw === 'true' && task.targetSteps && !stepsCountRaw.trim()) {
      setActionError('Faltan los pasos (esta tarea tiene pasos objetivo).');
      return;
    }

    setSavingTaskId(task.id);
    try {
      await apiRequest(`/evaluations/${evaluationId}/task-attempts`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          taskId: task.id,
          completed: completedRaw === 'true',
          errorsCount: errorsCountRaw.trim() ? Number(errorsCountRaw) : undefined,
          timeSec: timeSecRaw.trim() ? Number(timeSecRaw) : undefined,
          stepsCount: stepsCountRaw.trim() ? Number(stepsCountRaw) : undefined,
          notes: notesRaw.trim() ? notesRaw.trim() : undefined,
        }),
      });
      clearAttemptDraft(task.id);
      await refreshEvaluation();
    } catch {
      setActionError('No se pudo guardar el intento de la tarea');
    } finally {
      setSavingTaskId(null);
    }
  }

  function clearAttemptDraft(taskId: number) {
    setAttemptDrafts((s) => {
      const next = { ...s };
      delete next[taskId];
      return next;
    });
  }

  async function onSubmitAnswers() {
    const selectedInterface = questionnaireInterface;
    if (!selectedInterface) {
      setActionError('Selecciona una interfaz antes de responder el cuestionario.');
      return;
    }
    if (!canSubmit) {
      setActionError('Solo un evaluador asignado puede registrar respuestas.');
      return;
    }
    setSavingAnswers(true);
    setActionError(null);
    try {
      const selectedAnswers = answersByInterface[selectedInterface.id] ?? {};
      const fingerprint = answersFingerprint(selectedInterface.questions, selectedAnswers);
      const missingRequired = selectedInterface.questions
        .filter((q) => q.isRequired)
        .filter((q) => {
          const v = selectedAnswers[q.id];
          if (q.type === 'TEXT') return !String(v ?? '').trim();
          if (q.type === 'BOOLEAN') return v !== 'true' && v !== 'false' && v !== true && v !== false;
          if (q.type === 'LIKERT_1_5') {
            if (v === '' || v === null || v === undefined) return true;
            const n = Number(v);
            return !Number.isFinite(n) || n < 1 || n > 5;
          }
          if (v === '' || v === null || v === undefined) return true;
          const n = Number(v);
          return !Number.isFinite(n);
        });

      if (missingRequired.length > 0) {
        setActionError('Completa todas las preguntas obligatorias antes de guardar.');
        setPendingScrollQuestionId(missingRequired[0]?.id ?? null);
        return;
      }

      const answerPayload: Array<{
        questionId: number;
        valueLikert?: number;
        valueNumber?: number;
        valueBoolean?: boolean;
        valueText?: string;
      }> = [];

      for (const q of selectedInterface.questions) {
        const v = selectedAnswers[q.id];
        const raw = typeof v === 'string' ? v.trim() : v;

        if (q.type === 'LIKERT_1_5') {
          if (raw === '' || raw === null || raw === undefined) {
            if (!q.isRequired) continue;
            continue;
          }
          const n = typeof raw === 'number' ? raw : Number(raw);
          if (!Number.isFinite(n) || n < 1 || n > 5) continue;
          answerPayload.push({ questionId: q.id, valueLikert: n });
          continue;
        }

        if (q.type === 'NUMBER') {
          if (raw === '' || raw === null || raw === undefined) {
            if (!q.isRequired) continue;
            continue;
          }
          const n = typeof raw === 'number' ? raw : Number(raw);
          if (!Number.isFinite(n)) continue;
          answerPayload.push({ questionId: q.id, valueNumber: n });
          continue;
        }

        if (q.type === 'BOOLEAN') {
          if (raw === 'true' || raw === true) {
            answerPayload.push({ questionId: q.id, valueBoolean: true });
            continue;
          }
          if (raw === 'false' || raw === false) {
            answerPayload.push({ questionId: q.id, valueBoolean: false });
            continue;
          }
          if (!q.isRequired) continue;
          continue;
        }

        const text = String(raw ?? '').trim();
        if (!text) {
          if (!q.isRequired) continue;
          continue;
        }
        answerPayload.push({ questionId: q.id, valueText: text });
      }

      const payload = {
        interfaceId: selectedInterface.id,
        answers: answerPayload,
      };

      await apiRequest(`/evaluations/${evaluationId}/answers`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify(payload),
      });
      setSavedAnswersFingerprintByInterfaceId((s) => ({ ...s, [selectedInterface.id]: fingerprint }));
      setSubmittedInterfaceIdMap((s) => ({ ...s, [selectedInterface.id]: true }));
      await refreshEvaluation();
      setInterfaceBreakdown(null);
      if (showInterfaceBreakdown) {
        queueMicrotask(() => {
          void onLoadInterfaceBreakdown();
        });
      }

      const nextSubmitted = { ...submittedInterfaceIdMap, [selectedInterface.id]: true };
      const idx = interfaces.findIndex((i) => i.id === selectedInterface.id);
      let nextInterfaceId: number | null = null;
      const isSubmitted = (interfaceId: number) => Boolean(nextSubmitted[interfaceId]) || lockedInterfaceIds.has(interfaceId);
      if (idx >= 0) {
        for (let j = idx + 1; j < interfaces.length; j += 1) {
          const cand = interfaces[j];
          if (!cand) continue;
          if (!isSubmitted(cand.id)) {
            nextInterfaceId = cand.id;
            break;
          }
        }
        if (nextInterfaceId === null) {
          for (let j = 0; j < idx; j += 1) {
            const cand = interfaces[j];
            if (!cand) continue;
            if (!isSubmitted(cand.id)) {
              nextInterfaceId = cand.id;
              break;
            }
          }
        }
      }

      if (nextInterfaceId !== null) {
        setMySelectionDraftId(nextInterfaceId);
        setSelectedInterfaceId(nextInterfaceId);
        setPendingScrollQuestionId(null);
        setStep('run');
        setTimeout(() => {
          questionnaireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      } else {
        setStep('results');
      }
    } catch (e) {
      const apiErr = e as Partial<ApiError>;
      setActionError(apiErr.message ?? 'No se pudieron guardar las respuestas');
    } finally {
      setSavingAnswers(false);
    }
  }

  async function onCompute() {
    if (!completeness) {
      const loaded = await onLoadCompleteness();
      if (!loaded) return;
      if (!loaded.summary.hasStructure || !loaded.summary.hasAnyData) return;
    }
    if (completeness?.summary.hasPending) {
      const ok = window.confirm(
        'Hay evaluadores sin interfaz seleccionada o preguntas obligatorias sin responder. Calcular ahora puede generar resultados incompletos.\n\nDeseas calcular de todos modos?',
      );
      if (!ok) return;
    }
    setComputing(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/${evaluationId}/compute-results`, {
        method: 'POST',
        token: token ?? undefined,
      });
      await refreshEvaluation();
    } catch {
      setActionError('No se pudieron calcular los resultados (verifica que existan respuestas o intentos)');
    } finally {
      setComputing(false);
    }
  }

  async function onSaveScoringWeights() {
    if (!canManage) return;
    const effectiveness = Number(scoringWeightsDraft.effectiveness);
    const efficiency = Number(scoringWeightsDraft.efficiency);
    const satisfaction = Number(scoringWeightsDraft.satisfaction);

    if (
      Number.isNaN(effectiveness) ||
      Number.isNaN(efficiency) ||
      Number.isNaN(satisfaction) ||
      effectiveness < 0 ||
      efficiency < 0 ||
      satisfaction < 0
    ) {
      setActionError('Los pesos deben ser números válidos (>= 0).');
      return;
    }

    setSavingScoringWeights(true);
    setActionError(null);
    try {
      await apiRequest(`/evaluations/${evaluationId}/scoring-weights`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ effectiveness, efficiency, satisfaction }),
      });
      await refreshEvaluation();
      setInterfaceBreakdown(null);
      setResultsBreakdown(null);
    } catch {
      setActionError('No se pudieron guardar los pesos de scoring');
    } finally {
      setSavingScoringWeights(false);
    }
  }

  async function onLoadResultsBreakdown() {
    setLoadingBreakdown(true);
    setActionError(null);
    try {
      const data = await apiRequest<ResultsBreakdown>(
        `/evaluations/${evaluationId}/results-breakdown`,
        {
          token: token ?? undefined,
        },
      );
      setResultsBreakdown(data);
    } catch {
      setActionError('No se pudo cargar el detalle por evaluador');
    } finally {
      setLoadingBreakdown(false);
    }
  }

  const onLoadInterfaceBreakdown = useCallback(async () => {
    setLoadingInterfaceBreakdown(true);
    setActionError(null);
    try {
      const data = await apiRequest<InterfaceBreakdown>(
        `/evaluations/${evaluationId}/interface-breakdown`,
        { token: token ?? undefined },
      );
      setInterfaceBreakdown(data);
    } catch {
      setActionError('No se pudo cargar el detalle por interfaz');
    } finally {
      setLoadingInterfaceBreakdown(false);
    }
  }, [evaluationId, token]);

  useEffect(() => {
    if (!ev) return;
    if (!canSubmit) return;
    if (step !== 'run') return;
    if (loadingInterfaceBreakdown) return;
    if (interfaceBreakdown) return;
    queueMicrotask(() => {
      void onLoadInterfaceBreakdown();
    });
  }, [ev, canSubmit, step, loadingInterfaceBreakdown, interfaceBreakdown, onLoadInterfaceBreakdown]);

  useEffect(() => {
    if (!canSubmit) return;
    const currentInterfaceId = questionnaireInterface?.id ?? null;
    if (currentInterfaceId === null) return;
    if (!lockedInterfaceIds.has(currentInterfaceId)) return;
    if (loadingSavedAnswersInterfaceId === currentInterfaceId) return;

    const existing = answersByInterface[currentInterfaceId] ?? {};
    const hasAnyValue = Object.values(existing).some((v) => v !== '' && v !== null && v !== undefined);
    if (hasAnyValue) return;

    queueMicrotask(() => {
      void onLoadMyAnswers(currentInterfaceId);
    });
  }, [
    canSubmit,
    questionnaireInterface,
    lockedInterfaceIds,
    loadingSavedAnswersInterfaceId,
    answersByInterface,
    onLoadMyAnswers,
  ]);

  const onLoadCompleteness = useCallback(async () => {
    setLoadingCompleteness(true);
    setActionError(null);
    try {
      const data = await apiRequest<Completeness>(
        `/evaluations/${evaluationId}/completeness`,
        { token: token ?? undefined },
      );
      setCompleteness(data);
      setCompletenessLoadedAt(new Date().toISOString());
      return data;
    } catch {
      setActionError('No se pudo cargar el checklist para calcular');
      return null;
    } finally {
      setLoadingCompleteness(false);
    }
  }, [evaluationId, token]);

  async function onDownloadReport() {
    setDownloadingReport(true);
    setActionError(null);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/evaluations/${evaluationId}/report.pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const text = await res.text();
        let message = text || res.statusText;
        try {
          const parsed = JSON.parse(text) as { message?: string | string[] };
          if (typeof parsed.message === 'string') message = parsed.message;
          if (Array.isArray(parsed.message)) message = parsed.message.join('\n');
        } catch {
          void 0;
        }
        throw { status: res.status, message } satisfies ApiError;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluacion-${evaluationId}-reporte.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const apiErr = e as Partial<ApiError>;
      setActionError(apiErr.message ?? 'No se pudo generar el PDF');
    } finally {
      setDownloadingReport(false);
    }
  }

  useEffect(() => {
    if (!canManage) return;
    if (!ev) return;
    if (step !== 'results') return;
    if (loadingCompleteness) return;
    if (completeness) return;
    queueMicrotask(() => {
      void onLoadCompleteness();
    });
  }, [canManage, ev, step, loadingCompleteness, completeness, onLoadCompleteness]);

  useEffect(() => {
    if (!ev) return;
    if (step !== 'results') return;
    if (loadingInterfaceBreakdown) return;
    if (interfaceBreakdown) return;
    queueMicrotask(() => {
      void onLoadInterfaceBreakdown();
    });
  }, [ev, step, loadingInterfaceBreakdown, interfaceBreakdown, onLoadInterfaceBreakdown]);

  if (loading) return <div className="card">Cargando…</div>;
  if (error) return <div className="alert">{error}</div>;
  if (!ev) return <div className="card">No encontrado</div>;

  const steps = canManage
    ? allSteps
    : allSteps.filter((s) => s.id === 'run' || s.id === 'results');

  const viewStep: StepId = canManage ? step : step === 'results' ? 'results' : 'run';
  const stepOrder = steps.map((s) => s.id);
  const stepIndex = stepOrder.indexOf(viewStep);
  const prevStep = stepIndex > 0 ? stepOrder[stepIndex - 1] ?? null : null;
  const nextStep = stepIndex >= 0 ? stepOrder[stepIndex + 1] ?? null : null;

  const allTasks = ev.interfaces.flatMap((intf) =>
    intf.tasks.map((task) => ({ interfaceName: intf.name, task })),
  );

  const needsUserStories = manualUserStories.length === 0;
  const needsInterfaces = interfaces.length === 0;
  const needsStructure = !needsInterfaces && !interfaces.some((i) => i.questions.length > 0);
  const showTasks = false;

  const mySession = ev.sessions.find((s) => s.status === 'IN_PROGRESS') ?? null;

  function goNext() {
    if (!nextStep) return;
    if (!canGoToStep(nextStep)) return;
    setStep(nextStep);
  }

  function goBack() {
    if (!prevStep) return;
    setStep(prevStep);
  }

  function goToPendingQuestion(interfaceId: number, questionId: number) {
    setSelectedInterfaceId(interfaceId);
    setStep('run');
    setPendingScrollQuestionId(questionId);
  }

  function renderUserStoriesStep() {
    return (
      <div className="card">
        <div className="subCard">
          <h3>Historias de usuario</h3>
          <form onSubmit={onCreateManualStory} className="form">
            <div className="muted">
              Vincula historias a interfaces en el paso 2) Interfaces.
            </div>
            <div className="grid2">
              <label className="field">
                <span>Prioridad (1-5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={manualStoryDraft.priority}
                  onChange={(e) => setManualStoryDraft((s) => ({ ...s, priority: e.target.value }))}
                  required
                />
              </label>
            </div>
            <div className="grid2">
              <label className="field">
                <span>Estado</span>
                <select
                  value={manualStoryDraft.status}
                  onChange={(e) =>
                    setManualStoryDraft((s) => ({
                      ...s,
                      status: e.target.value as '' | ManualUserStory['status'],
                    }))
                  }
                  required
                >
                  <option value="">Seleccionar…</option>
                  <option value="DRAFT">Borrador</option>
                  <option value="APPROVED">Aprobada</option>
                  <option value="DONE">Hecha</option>
                </select>
              </label>
              <label className="field">
                <span>Prioridad MoSCoW</span>
                <select
                  value={manualStoryDraft.mosCow}
                  onChange={(e) =>
                    setManualStoryDraft((s) => ({
                      ...s,
                      mosCow: e.target.value as '' | ManualUserStory['mosCow'],
                    }))
                  }
                  required
                >
                  <option value="">Seleccionar…</option>
                  <option value="MUST">Debe</option>
                  <option value="SHOULD">Debería</option>
                  <option value="COULD">Podría</option>
                  <option value="WONT">No se hará</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Título</span>
              <input
                value={manualStoryDraft.title}
                onChange={(e) => setManualStoryDraft((s) => ({ ...s, title: e.target.value }))}
                required
                minLength={3}
              />
            </label>
            <label className="field">
              <span>Narrativa</span>
              <textarea
                value={manualStoryDraft.narrative}
                onChange={(e) => setManualStoryDraft((s) => ({ ...s, narrative: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Criterios de aceptación</span>
              <textarea
                value={manualStoryDraft.acceptanceCriteria}
                onChange={(e) =>
                  setManualStoryDraft((s) => ({ ...s, acceptanceCriteria: e.target.value }))
                }
                required
              />
            </label>
            <div className="grid2">
              <label className="field">
                <span>Alcance</span>
                <input
                  type="number"
                  min={0}
                  value={manualStoryDraft.riceReach}
                  onChange={(e) => setManualStoryDraft((s) => ({ ...s, riceReach: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Impacto</span>
                <input
                  type="number"
                  min={0}
                  value={manualStoryDraft.riceImpact}
                  onChange={(e) => setManualStoryDraft((s) => ({ ...s, riceImpact: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid2">
              <label className="field">
                <span>Confianza</span>
                <input
                  type="number"
                  min={0}
                  value={manualStoryDraft.riceConfidence}
                  onChange={(e) =>
                    setManualStoryDraft((s) => ({ ...s, riceConfidence: e.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>Esfuerzo</span>
                <input
                  type="number"
                  min={0}
                  value={manualStoryDraft.riceEffort}
                  onChange={(e) => setManualStoryDraft((s) => ({ ...s, riceEffort: e.target.value }))}
                />
              </label>
            </div>
            <button className="btn btnSecondary">Agregar historia</button>
          </form>

          {manualUserStories.length === 0 ? (
            <div className="muted">Aún no hay historias manuales.</div>
          ) : (
            <div className="stack">
              {manualUserStories.map((s) => {
                const locked = true;
                const edit = locked ? {} : (manualStoryEdits[s.id] ?? {});
                const title = edit.title ?? s.title;
                const narrative = edit.narrative ?? s.narrative;
                const acceptanceCriteria = edit.acceptanceCriteria ?? s.acceptanceCriteria;
                const status = edit.status ?? s.status;
                const mosCow = edit.mosCow ?? s.mosCow;
                const priority = edit.priority ?? String(s.priority);
                const riceReach = edit.riceReach ?? String(s.riceReach ?? '');
                const riceImpact = edit.riceImpact ?? String(s.riceImpact ?? '');
                const riceConfidence = edit.riceConfidence ?? String(s.riceConfidence ?? '');
                const riceEffort = edit.riceEffort ?? String(s.riceEffort ?? '');
                const changed = manualStoryEdits[s.id] !== undefined;

                return (
                  <div key={s.id} className="card">
                    <div className="pillRow">
                      <span className="pill">P{s.priority}</span>
                      <span className="pill">{fmtMosCow(mosCow)}</span>
                      {s.interface ? <span className="pill">{s.interface.name}</span> : null}
                      {s.recommendedInterface ? (
                        <span className="pill">Recomendada: {s.recommendedInterface.name}</span>
                      ) : s.recommendedInterfaceId ? (
                        <span className="pill">
                          Recomendada:{' '}
                          {interfaceById.get(s.recommendedInterfaceId)?.name ??
                            s.recommendedInterfaceId}
                        </span>
                      ) : null}
                      <span className="muted">por {s.createdBy.fullName}</span>
                    </div>
                    {locked ? (
                      <div className="muted">Historia registrada. No se pueden modificar sus campos.</div>
                    ) : null}
                    <label className="field">
                      <span>Título</span>
                      <input
                        value={title}
                        disabled={locked}
                        onChange={(e) =>
                          setManualStoryEdits((st) => ({
                            ...st,
                            [s.id]: { ...st[s.id], title: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Narrativa</span>
                      <textarea
                        value={narrative}
                        disabled={locked}
                        onChange={(e) =>
                          setManualStoryEdits((st) => ({
                            ...st,
                            [s.id]: { ...st[s.id], narrative: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Criterios de aceptación</span>
                      <textarea
                        value={acceptanceCriteria}
                        disabled={locked}
                        onChange={(e) =>
                          setManualStoryEdits((st) => ({
                            ...st,
                            [s.id]: { ...st[s.id], acceptanceCriteria: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <div className="grid2">
                      <label className="field">
                        <span>Estado</span>
                        <select
                          value={status}
                          disabled={locked}
                          onChange={(e) =>
                            setManualStoryEdits((st) => ({
                              ...st,
                              [s.id]: {
                                ...st[s.id],
                                status: e.target.value as ManualUserStory['status'],
                              },
                            }))
                          }
                        >
                          <option value="DRAFT">Borrador</option>
                          <option value="APPROVED">Aprobada</option>
                          <option value="DONE">Hecha</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Prioridad MoSCoW</span>
                        <select
                          value={mosCow}
                          disabled={locked}
                          onChange={(e) =>
                            setManualStoryEdits((st) => ({
                              ...st,
                              [s.id]: {
                                ...st[s.id],
                                mosCow: e.target.value as ManualUserStory['mosCow'],
                              },
                            }))
                          }
                        >
                          <option value="MUST">Debe</option>
                          <option value="SHOULD">Debería</option>
                          <option value="COULD">Podría</option>
                          <option value="WONT">No se hará</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid2">
                      <label className="field">
                        <span>Prioridad (1-5)</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={priority}
                          disabled={locked}
                          onChange={(e) =>
                            setManualStoryEdits((st) => ({
                              ...st,
                              [s.id]: { ...st[s.id], priority: e.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Alcance</span>
                        <input
                          type="number"
                          min={0}
                          value={riceReach}
                          disabled={locked}
                          onChange={(e) =>
                            setManualStoryEdits((st) => ({
                              ...st,
                              [s.id]: { ...st[s.id], riceReach: e.target.value },
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="grid2">
                      <label className="field">
                        <span>Impacto</span>
                        <input
                          type="number"
                          min={0}
                          value={riceImpact}
                          disabled={locked}
                          onChange={(e) =>
                            setManualStoryEdits((st) => ({
                              ...st,
                              [s.id]: { ...st[s.id], riceImpact: e.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Confianza</span>
                        <input
                          type="number"
                          min={0}
                          value={riceConfidence}
                          disabled={locked}
                          onChange={(e) =>
                            setManualStoryEdits((st) => ({
                              ...st,
                              [s.id]: { ...st[s.id], riceConfidence: e.target.value },
                            }))
                          }
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span>Esfuerzo</span>
                      <input
                        type="number"
                        min={0}
                        value={riceEffort}
                        disabled={locked}
                        onChange={(e) =>
                          setManualStoryEdits((st) => ({
                            ...st,
                            [s.id]: { ...st[s.id], riceEffort: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <div className="pillRow">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => onSaveManualStory(s.id)}
                        disabled={locked || !changed}
                        title={locked ? 'Las historias guardadas no se pueden modificar.' : undefined}
                      >
                        Guardar cambios
                      </button>
                      <button
                        type="button"
                        className="btn btnDanger"
                        onClick={() => onDeleteManualStory(s.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderInterfacesStep() {
    return (
      <div className="splitPane">
        <div className="card">
          <h2>Interfaces</h2>
          {canManage ? (
            <form onSubmit={onAddInterface} className="form">
              <label className="field">
                <span>Nombre de la pantalla</span>
                <input value={interfaceName} onChange={(e) => setInterfaceName(e.target.value)} required />
              </label>
              <label className="field">
                <span>Imagen (opcional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0] ?? null;
                    if (!file) return;
                    if (file.size > 2_000_000) {
                      setInterfaceImageFileError('La imagen supera 2MB. Usa una imagen más liviana.');
                      return;
                    }
                    setInterfaceImageFileError(null);
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = String(reader.result ?? '');
                      setInterfaceImageUrl(result);
                    };
                    reader.onerror = () => setInterfaceImageFileError('No se pudo leer la imagen.');
                    reader.readAsDataURL(file);
                  }}
                />
                {interfaceImageFileError ? <div className="alert">{interfaceImageFileError}</div> : null}
              </label>
              <label className="field">
                <span>URL de imagen (alternativa)</span>
                <input value={interfaceImageUrl} onChange={(e) => setInterfaceImageUrl(e.target.value)} />
              </label>
              <label className="field">
                <span>URL del prototipo (recomendado)</span>
                <input
                  value={interfacePrototypeUrl}
                  onChange={(e) => setInterfacePrototypeUrl(e.target.value)}
                  placeholder="https://..."
                />
                <span className="muted">
                  Ejemplo: enlace a Figma, prototipo web o módulo funcional para probar la interfaz.
                </span>
              </label>
              <button className="btn" disabled={addingInterface}>
                {addingInterface ? 'Agregando…' : 'Agregar interfaz'}
              </button>
            </form>
          ) : (
            <div className="muted">
              Solo el creador de la evaluación (o un administrador) puede agregar o editar
              interfaces/preguntas/tareas.
            </div>
          )}
          <div className="list">
            {interfaces.map((i) => {
              const selected = activeInterface?.id === i.id;
              return (
                <button
                  key={i.id}
                  type="button"
                  className={selected ? 'listItem listItemActive' : 'listItem'}
                  onClick={() => setSelectedInterfaceId(i.id)}
                >
                  <div className="cardTitle">{i.name}</div>
                  <div className="muted">
                    {i.questions.length} preguntas · {i.tasks.length} tareas
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h2>Vista previa</h2>
          {!activeInterface ? (
            <div className="muted">Agrega una interfaz para empezar.</div>
          ) : (
            <>
              {interfaces.length > 1 ? (
                <label className="field">
                  <span>Pantalla seleccionada</span>
                  <select value={activeInterface.id} onChange={(e) => setSelectedInterfaceId(Number(e.target.value))}>
                    {interfaces.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {canManage && activeInterfaceEdit ? (
                <div className="subCard">
                  <h3>Editar interfaz</h3>
                  <div className="form">
                    <label className="field">
                      <span>Nombre</span>
                      <input
                        value={activeInterfaceEdit.name}
                        onChange={(e) => patchInterfaceEdit(activeInterface.id, activeInterfaceEdit, { name: e.target.value })}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Imagen (URL / DataURL)</span>
                      <input
                        value={activeInterfaceEdit.imageUrl}
                        onChange={(e) =>
                          patchInterfaceEdit(activeInterface.id, activeInterfaceEdit, { imageUrl: e.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>URL del prototipo</span>
                      <input
                        value={activeInterfaceEdit.prototypeUrl}
                        onChange={(e) =>
                          patchInterfaceEdit(activeInterface.id, activeInterfaceEdit, { prototypeUrl: e.target.value })
                        }
                        placeholder="https://..."
                      />
                      <div className="pillRow">
                        {activeInterfaceEdit.prototypeUrl.trim() ? (
                          <a
                            className="btn btnSecondary"
                            href={activeInterfaceEdit.prototypeUrl.trim()}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir prototipo
                          </a>
                        ) : (
                          <span className="muted">Agrega un enlace para probar la interfaz.</span>
                        )}
                      </div>
                    </label>
                    <div className="pillRow">
                      <button
                        type="button"
                        className="btn btnSecondary"
                        onClick={() => onMoveInterface('up')}
                        disabled={savingInterface || interfaces[0]?.id === activeInterface.id}
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        className="btn btnSecondary"
                        onClick={() => onMoveInterface('down')}
                        disabled={
                          savingInterface || interfaces[interfaces.length - 1]?.id === activeInterface.id
                        }
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        className="btn btnSecondary"
                        onClick={onSaveInterface}
                        disabled={savingInterface}
                      >
                        {savingInterface ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        className="btn btnDanger"
                        onClick={onDeleteInterface}
                        disabled={savingInterface}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {canManage ? (
                <div className="subCard">
                  <h3>Vincular historias a esta interfaz</h3>
                  {manualUserStories.length === 0 ? (
                    <div className="muted">Crea historias en el paso 1 para poder vincularlas.</div>
                  ) : (
                    <div className="stack">
                      {manualUserStories.map((s) => {
                        const linked = s.interfaceId === activeInterface.id;
                        const otherInterfaceName = s.interface?.name ?? null;
                        const working = linkingManualStoryId === s.id;
                        const savingRecommended = savingManualStoryRecommendedId === s.id;
                        return (
                          <div key={s.id} className="card">
                            <div className="cardTitle">{s.title}</div>
                            <div className="muted">
                              {linked
                                ? 'Ya vinculada a esta interfaz.'
                                : otherInterfaceName
                                  ? `Actualmente vinculada a: ${otherInterfaceName}`
                                  : 'Actualmente: sin interfaz.'}
                            </div>
                            <label className="field">
                              <span>Interfaz recomendada</span>
                              <select
                                value={s.recommendedInterfaceId ?? ''}
                                onChange={(e) =>
                                  void onSetStoryRecommendedInterface(
                                    s.id,
                                    e.target.value ? Number(e.target.value) : null,
                                  )
                                }
                                disabled={needsInterfaces || savingRecommended}
                              >
                                <option value="">Sin definir</option>
                                {interfaces.map((i) => (
                                  <option key={i.id} value={i.id}>
                                    {i.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className="pillRow">
                              <button
                                type="button"
                                className="btn btnSecondary"
                                onClick={() => onLinkStoryToActiveInterface(s.id)}
                                disabled={linked || working || savingRecommended}
                              >
                                {working ? 'Vinculando…' : 'Vincular aquí'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
              {(activeInterfaceEdit?.imageUrl.trim() ? activeInterfaceEdit.imageUrl : activeInterface.imageUrl) ? (
                <img
                  className="mock"
                  src={
                    activeInterfaceEdit?.imageUrl.trim()
                      ? activeInterfaceEdit.imageUrl
                      : (activeInterface.imageUrl as string)
                  }
                  alt={activeInterface.name}
                />
              ) : (
                <div className="muted">
                  Puedes agregar una imagen opcional para que el evaluador vea la pantalla.
                </div>
              )}
              <div className="pillRow">
                <span className="pill">{activeInterface.tasks.length} tareas</span>
                <span className="pill">{activeInterface.questions.length} preguntas</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderStructureStep() {
    return (
      <div className="splitPane">
        <div className="card stickyPane">
          <h2>Selecciona interfaz</h2>
          {!activeInterface ? (
            <div className="muted">Agrega una interfaz para empezar.</div>
          ) : (
            <>
              {interfaces.length > 1 ? (
                <label className="field">
                  <span>Pantalla</span>
                  <select value={activeInterface.id} onChange={(e) => setSelectedInterfaceId(Number(e.target.value))}>
                    {interfaces.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {(activeInterfaceEdit?.imageUrl.trim() ? activeInterfaceEdit.imageUrl : activeInterface.imageUrl) ? (
                <img
                  className="mock"
                  src={
                    activeInterfaceEdit?.imageUrl.trim()
                      ? activeInterfaceEdit.imageUrl
                      : (activeInterface.imageUrl as string)
                  }
                  alt={activeInterface.name}
                />
              ) : null}
              <div className="muted">
                Define primero la estructura (tareas y preguntas). Luego ve a “Evaluación” para registrar intentos y
                respuestas.
              </div>
            </>
          )}
        </div>
        <div className="card">
          <h2>Estructura</h2>
          {!activeInterface ? (
            <div className="muted">Agrega una interfaz para empezar.</div>
          ) : (
            <>
              <div className="subCard">
                <h3>Tareas</h3>
                {canManage ? (
                  <form onSubmit={onAddTask} className="form">
                    <label className="field">
                      <span>Título</span>
                      <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required minLength={3} />
                    </label>
                    <label className="field">
                      <span>Descripción (opcional)</span>
                      <input value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
                    </label>
                    <div className="grid2">
                      <label className="field">
                        <span>Tiempo objetivo (seg) (opcional)</span>
                        <input
                          type="number"
                          min={1}
                          value={taskTargetTimeSec}
                          onChange={(e) => setTaskTargetTimeSec(e.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Pasos objetivo (opcional)</span>
                        <input
                          type="number"
                          min={1}
                          value={taskTargetSteps}
                          onChange={(e) => setTaskTargetSteps(e.target.value)}
                        />
                      </label>
                    </div>
                    <button className="btn" disabled={addingTask}>
                      {addingTask ? 'Agregando…' : 'Agregar tarea'}
                    </button>
                  </form>
                ) : (
                  <div className="muted">No puedes editar la estructura en esta evaluación.</div>
                )}
                {activeInterface.tasks.length === 0 ? (
                  <div className="muted">Aún no hay tareas para esta interfaz.</div>
                ) : (
                  <div className="list">
                    {activeInterface.tasks.map((t) => {
                      const isEditing = editingTaskId === t.id;
                      const edit = taskEdits[t.id];
                      const isWorking = taskWorkingId === t.id;
                      const isFirst = activeInterface.tasks[0]?.id === t.id;
                      const isLast = activeInterface.tasks[activeInterface.tasks.length - 1]?.id === t.id;
                      return (
                        <div key={t.id} className="listItem">
                          {isEditing && edit ? (
                            <div className="form">
                              <label className="field">
                                <span>Título</span>
                                <input
                                  value={edit.title}
                                  onChange={(e) => patchTaskEdit(t.id, edit, { title: e.target.value })}
                                  required
                                />
                              </label>
                              <label className="field">
                                <span>Descripción</span>
                                <input
                                  value={edit.description}
                                  onChange={(e) => patchTaskEdit(t.id, edit, { description: e.target.value })}
                                />
                              </label>
                              <div className="grid2">
                                <label className="field">
                                  <span>Tiempo objetivo (seg)</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={edit.targetTimeSec}
                                    onChange={(e) => patchTaskEdit(t.id, edit, { targetTimeSec: e.target.value })}
                                  />
                                </label>
                                <label className="field">
                                  <span>Pasos objetivo</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={edit.targetSteps}
                                    onChange={(e) => patchTaskEdit(t.id, edit, { targetSteps: e.target.value })}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="cardTitle">{t.title}</div>
                              <div className="pillRow">
                                {t.targetTimeSec ? (
                                  <span className="pill pillInfo">Tiempo objetivo: {t.targetTimeSec}s</span>
                                ) : (
                                  <span className="pill pillWarn">Sin tiempo objetivo</span>
                                )}
                                {t.targetSteps ? (
                                  <span className="pill pillInfo">Pasos objetivo: {t.targetSteps}</span>
                                ) : (
                                  <span className="pill pillWarn">Sin pasos objetivo</span>
                                )}
                              </div>
                            </>
                          )}
                          {canManage ? (
                            <div className="pillRow">
                              <button
                                type="button"
                                className="btn btnSecondary"
                                onClick={() => onMoveTask(t.id, 'up')}
                                disabled={taskWorkingId !== null || isFirst}
                              >
                                Subir
                              </button>
                              <button
                                type="button"
                                className="btn btnSecondary"
                                onClick={() => onMoveTask(t.id, 'down')}
                                disabled={taskWorkingId !== null || isLast}
                              >
                                Bajar
                              </button>
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btnSecondary"
                                    onClick={() => onSaveTask(t.id)}
                                    disabled={taskWorkingId !== null}
                                  >
                                    {isWorking ? 'Guardando…' : 'Guardar'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btnSecondary"
                                    onClick={() => setEditingTaskId(null)}
                                    disabled={taskWorkingId !== null}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btnSecondary"
                                  onClick={() => startEditTask(t)}
                                  disabled={taskWorkingId !== null}
                                >
                                  Editar
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btnDanger"
                                onClick={() => onDeleteTask(t)}
                                disabled={taskWorkingId !== null}
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="subCard">
                <h3>Preguntas (ISO 9241-11)</h3>
                <div className="pillRow">
                  <button
                    type="button"
                    className="btn btnSecondary"
                    onClick={onApplyIsoTemplate}
                    disabled={!canManage || addingTemplate}
                  >
                    {addingTemplate ? 'Agregando…' : 'Agregar plantilla ISO'}
                  </button>
                </div>
                {canManage ? (
                  <form onSubmit={onAddQuestion} className="form">
                    <label className="field">
                      <span>Dimensión</span>
                      <select
                        value={questionDimension}
                        onChange={(e) =>
                          setQuestionDimension(e.target.value as 'EFFECTIVENESS' | 'EFFICIENCY' | 'SATISFACTION')
                        }
                        required
                      >
                        <option value="">Seleccionar…</option>
                        <option value="EFFECTIVENESS">Efectividad</option>
                        <option value="EFFICIENCY">Eficiencia</option>
                        <option value="SATISFACTION">Satisfacción</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Tipo</span>
                      <select
                        value={questionType}
                        onChange={(e) =>
                          setQuestionType(e.target.value as 'NUMBER' | 'LIKERT_1_5' | 'TEXT' | 'BOOLEAN')
                        }
                        required
                      >
                        <option value="">Seleccionar…</option>
                        <option value="LIKERT_1_5">Likert 1-5</option>
                        <option value="NUMBER">Número</option>
                        <option value="BOOLEAN">Sí/No</option>
                        <option value="TEXT">Texto</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Enunciado</span>
                      <input
                        value={questionPrompt}
                        onChange={(e) => setQuestionPrompt(e.target.value)}
                        required
                        minLength={3}
                      />
                    </label>
                    <label className="field">
                      <span>Ayuda (opcional)</span>
                      <input value={questionHelpText} onChange={(e) => setQuestionHelpText(e.target.value)} />
                    </label>
                    <div className="grid2">
                      <label className="field">
                        <span>Peso</span>
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          value={questionWeight}
                          onChange={(e) => setQuestionWeight(e.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Obligatoria</span>
                        <select
                          value={questionIsRequired}
                          onChange={(e) => setQuestionIsRequired(e.target.value as '' | 'true' | 'false')}
                          required
                        >
                          <option value="">Seleccionar…</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </label>
                    </div>
                    <button className="btn btnSecondary">Agregar pregunta</button>
                  </form>
                ) : null}
                {activeInterface.questions.length === 0 ? (
                  <div className="muted">Aún no hay preguntas para esta interfaz.</div>
                ) : (
                  <div className="list">
                    {activeInterface.questions.map((q) => {
                      const isEditing = editingQuestionId === q.id;
                      const edit = questionEdits[q.id];
                      const isWorking = questionWorkingId === q.id;
                      const isFirst = activeInterface.questions[0]?.id === q.id;
                      const isLast = activeInterface.questions[activeInterface.questions.length - 1]?.id === q.id;
                      return (
                        <div key={q.id} className="listItem">
                          {isEditing && edit ? (
                            <div className="form">
                              <div className="grid2">
                                <label className="field">
                                  <span>Dimensión</span>
                                  <select
                                    value={edit.dimension}
                                    onChange={(e) =>
                                      patchQuestionEdit(q.id, edit, {
                                        dimension: e.target.value as Question['dimension'],
                                      })
                                    }
                                  >
                                    <option value="EFFECTIVENESS">Efectividad</option>
                                    <option value="EFFICIENCY">Eficiencia</option>
                                    <option value="SATISFACTION">Satisfacción</option>
                                  </select>
                                </label>
                                <label className="field">
                                  <span>Tipo</span>
                                  <select
                                    value={edit.type}
                                    onChange={(e) =>
                                      patchQuestionEdit(q.id, edit, { type: e.target.value as Question['type'] })
                                    }
                                  >
                                    <option value="LIKERT_1_5">Likert 1-5</option>
                                    <option value="NUMBER">Número</option>
                                    <option value="BOOLEAN">Sí/No</option>
                                    <option value="TEXT">Texto</option>
                                  </select>
                                </label>
                              </div>
                              <label className="field">
                                <span>Enunciado</span>
                                <input
                                  value={edit.prompt}
                                  onChange={(e) => patchQuestionEdit(q.id, edit, { prompt: e.target.value })}
                                  required
                                />
                              </label>
                              <label className="field">
                                <span>Ayuda</span>
                                <input
                                  value={edit.helpText}
                                  onChange={(e) => patchQuestionEdit(q.id, edit, { helpText: e.target.value })}
                                />
                              </label>
                              <div className="grid2">
                                <label className="field">
                                  <span>Peso</span>
                                  <input
                                    type="number"
                                    min={0.1}
                                    step={0.1}
                                    value={edit.weight}
                                    onChange={(e) => patchQuestionEdit(q.id, edit, { weight: e.target.value })}
                                  />
                                </label>
                                <label className="field">
                                  <span>Obligatoria</span>
                                  <select
                                    value={edit.isRequired ? 'true' : 'false'}
                                    onChange={(e) =>
                                      patchQuestionEdit(q.id, edit, { isRequired: e.target.value === 'true' })
                                    }
                                  >
                                    <option value="true">Sí</option>
                                    <option value="false">No</option>
                                  </select>
                                </label>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="cardTitle">{q.prompt}</div>
                              <div className="pillRow">
                                <span className={dimensionPillClass(q.dimension)}>{fmtDimension(q.dimension)}</span>
                                <span className={typePillClass(q.type)}>{fmtQuestionType(q.type)}</span>
                                <span className="pill">Peso {q.weight}</span>
                                <span className="pill">{q.isRequired ? 'Obligatoria' : 'Opcional'}</span>
                              </div>
                            </>
                          )}
                          {canManage ? (
                            <div className="pillRow">
                              <button
                                type="button"
                                className="btn btnSecondary"
                                onClick={() => onMoveQuestion(q.id, 'up')}
                                disabled={questionWorkingId !== null || isFirst}
                              >
                                Subir
                              </button>
                              <button
                                type="button"
                                className="btn btnSecondary"
                                onClick={() => onMoveQuestion(q.id, 'down')}
                                disabled={questionWorkingId !== null || isLast}
                              >
                                Bajar
                              </button>
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btnSecondary"
                                    onClick={() => onSaveQuestion(q.id)}
                                    disabled={questionWorkingId !== null}
                                  >
                                    {isWorking ? 'Guardando…' : 'Guardar'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btnSecondary"
                                    onClick={() => setEditingQuestionId(null)}
                                    disabled={questionWorkingId !== null}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btnSecondary"
                                  onClick={() => startEditQuestion(q)}
                                  disabled={questionWorkingId !== null}
                                >
                                  Editar
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btnDanger"
                                onClick={() => onDeleteQuestion(q)}
                                disabled={questionWorkingId !== null}
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderRunStep() {
    const patchAttemptDraft = (taskId: number, baseDraft: AttemptDraft, updates: Partial<AttemptDraft>) => {
      setAttemptDrafts((s) => ({ ...s, [taskId]: { ...baseDraft, ...updates } }));
    };

    const renderLeftPane = () => {
      if (interfaces.length === 0) return <div className="muted">Agrega una interfaz para empezar.</div>;

      if (canSubmit) {
        return (
          <>
            <div className="muted">Selecciona una interfaz para responder el cuestionario.</div>
            <label className="field">
              <span>Pantalla</span>
              <select
                value={mySelectionDraftId ?? ''}
                onChange={(e) => {
                  setActionError(null);
                  setMySelectionDraftId(e.target.value ? Number(e.target.value) : null);
                }}
                disabled={!canSubmit || loadingMySelection}
              >
                <option value="" disabled>
                  Seleccionar...
                </option>
                {interfaces.map((i) => (
                  <option key={i.id} value={i.id}>
                    {lockedInterfaceIds.has(i.id) ? `${i.name} (Guardada)` : i.name}
                  </option>
                ))}
              </select>
            </label>
            {myDraftInterface?.imageUrl ? <img className="mock" src={myDraftInterface.imageUrl} alt={myDraftInterface.name} /> : null}
            {myDraftInterface?.prototypeUrl ? (
              <div className="pillRow">
                <a className="btn btnSecondary" href={myDraftInterface.prototypeUrl} target="_blank" rel="noreferrer">
                  Abrir prototipo
                </a>
              </div>
            ) : null}
          </>
        );
      }

      return (
        <>
          {activeInterface && interfaces.length > 1 ? (
            <label className="field">
              <span>Pantalla</span>
              <select value={activeInterface.id} onChange={(e) => setSelectedInterfaceId(Number(e.target.value))}>
                {interfaces.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {activeInterface?.imageUrl ? <img className="mock" src={activeInterface.imageUrl} alt={activeInterface.name} /> : null}
          {activeInterface?.prototypeUrl ? (
            <div className="pillRow">
              <a className="btn btnSecondary" href={activeInterface.prototypeUrl} target="_blank" rel="noreferrer">
                Abrir prototipo
              </a>
            </div>
          ) : null}
          <div className="muted">Selecciona una interfaz para ver su imagen y preguntas.</div>
        </>
      );
    };

    const renderSessionCard = () => {
      if (!showTasks) return null;
      return (
        <div className="subCard">
          <h3>Sesión</h3>
          <div className="muted">Usa “Iniciar” al comenzar la evaluación y “Finalizar” al terminar.</div>
          {!canSubmit ? (
            <div className="alert">
              {isAdmin
                ? 'El administrador solo puede visualizar. Ingresa como evaluador para registrar datos.'
                : 'Debes estar asignado como evaluador para registrar datos.'}
            </div>
          ) : null}
          <div className="pillRow">
            <span className="pill">{mySession ? `Activa (#${mySession.id})` : 'Sin sesión activa'}</span>
            <button type="button" className="btn btnSecondary" onClick={onStartSession} disabled={sessionWorking || !canSubmit}>
              Iniciar sesión
            </button>
          </div>
          <label className="field">
            <span>Notas de cierre (opcional)</span>
            <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} disabled={!canSubmit} />
          </label>
          <button type="button" className="btn" onClick={onEndSession} disabled={!mySession || sessionWorking || !canSubmit}>
            Finalizar sesión
          </button>
        </div>
      );
    };

    const renderTaskAttemptsCard = () => {
      if (!showTasks) return null;

      const tasksInterface = activeInterface;
      if (!tasksInterface) {
        return (
          <div className="subCard" ref={tasksSectionRef}>
            <h3>Intentos de tareas</h3>
            <div className="muted">Selecciona una interfaz para registrar intentos.</div>
          </div>
        );
      }

      if (tasksInterface.tasks.length === 0) {
        return (
          <div className="subCard" ref={tasksSectionRef}>
            <h3>Intentos de tareas</h3>
            <div className="muted">No hay tareas definidas para esta interfaz.</div>
          </div>
        );
      }

      return (
        <div className="subCard" ref={tasksSectionRef}>
          <h3>Intentos de tareas</h3>
          <div className="grid">
            {tasksInterface.tasks.map((t) => {
              const attempt = t.attempts[0] ?? null;
              const draft = attemptDrafts[t.id];
              const completedValue = draft?.completed ?? (attempt ? (attempt.completed ? 'true' : 'false') : '');
              const errorsValue = draft?.errorsCount ?? (attempt ? String(attempt.errorsCount) : '');
              const timeValue =
                draft?.timeSec ??
                (attempt?.timeSec !== null && attempt?.timeSec !== undefined ? String(attempt.timeSec) : '');
              const stepsValue =
                draft?.stepsCount ??
                (attempt?.stepsCount !== null && attempt?.stepsCount !== undefined ? String(attempt.stepsCount) : '');
              const notesValue = draft?.notes ?? (attempt?.notes ?? '');

              const needsTime = completedValue === 'true' && Boolean(t.targetTimeSec) && !timeValue.trim();
              const needsSteps = completedValue === 'true' && Boolean(t.targetSteps) && !stepsValue.trim();
              const saveBlockedReason =
                completedValue !== 'true' && completedValue !== 'false'
                  ? 'Selecciona si la tarea fue completada (Sí/No).'
                  : needsTime
                    ? 'Falta el tiempo (esta tarea tiene tiempo objetivo).'
                    : needsSteps
                      ? 'Faltan los pasos (esta tarea tiene pasos objetivo).'
                      : null;

              const completion = completedValue ? completedValue : attempt ? (attempt.completed ? 'true' : 'false') : '';
              const completionLabel =
                completion === 'true' ? 'Completada: Sí' : completion === 'false' ? 'Completada: No' : null;

              const errorsLabel = formatAttemptValue('Errores', errorsValue);
              const timeLabel = formatAttemptValue('Tiempo (s)', timeValue);
              const stepsLabel = formatAttemptValue('Pasos', stepsValue);

              const isUpToDate = (() => {
                if (!attempt) return false;
                const nextCompleted = completedValue === 'true' ? true : completedValue === 'false' ? false : null;
                if (nextCompleted === null) return false;
                const nextErrors = errorsValue.trim() ? Number(errorsValue) : 0;
                const nextTime = timeValue.trim() ? Number(timeValue) : null;
                const nextSteps = stepsValue.trim() ? Number(stepsValue) : null;
                const nextNotes = notesValue.trim() ? notesValue.trim() : null;
                return (
                  attempt.completed === nextCompleted &&
                  attempt.errorsCount === nextErrors &&
                  (attempt.timeSec ?? null) === nextTime &&
                  (attempt.stepsCount ?? null) === nextSteps &&
                  (attempt.notes ?? null) === nextNotes
                );
              })();

              const currentDraft: AttemptDraft = {
                completed: completedValue as '' | 'true' | 'false',
                errorsCount: errorsValue,
                timeSec: timeValue,
                stepsCount: stepsValue,
                notes: notesValue,
              };

              return (
                <div key={t.id} id={`task-${t.id}`} className="card">
                  <div className="pillRow">
                    <span className="cardTitle">{t.title}</span>
                    {t.targetTimeSec ? (
                      <span className="pill pillInfo">Tiempo: {t.targetTimeSec}s</span>
                    ) : (
                      <span className="pill pillWarn">Sin tiempo</span>
                    )}
                    {t.targetSteps ? (
                      <span className="pill pillInfo">Pasos: {t.targetSteps}</span>
                    ) : (
                      <span className="pill pillWarn">Sin pasos</span>
                    )}
                  </div>
                  {t.description ? <div className="muted">{t.description}</div> : null}
                  {completionLabel || errorsLabel || timeLabel || stepsLabel ? (
                    <div className="pillRow">
                      {completionLabel ? (
                        <span
                          className={
                            completion === 'true' ? 'pill pillSuccess' : completion === 'false' ? 'pill pillDanger' : 'pill'
                          }
                        >
                          {completionLabel}
                        </span>
                      ) : null}
                      {errorsLabel ? <span className="pill">{errorsLabel}</span> : null}
                      {timeLabel ? <span className="pill">{timeLabel}</span> : null}
                      {stepsLabel ? <span className="pill">{stepsLabel}</span> : null}
                    </div>
                  ) : (
                    <div className="muted">Sin intento registrado</div>
                  )}

                  <div className="form">
                    <label className="field">
                      <span>Completada</span>
                      <select
                        value={completedValue}
                        onChange={(e) =>
                          patchAttemptDraft(t.id, currentDraft, {
                            completed: e.target.value as AttemptDraft['completed'],
                          })
                        }
                        disabled={!canSubmit}
                      >
                        <option value="">Selecciona</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </label>
                    <div className="grid2">
                      <label className="field">
                        <span>Errores</span>
                        <input
                          type="number"
                          min={0}
                          value={errorsValue}
                          onChange={(e) => patchAttemptDraft(t.id, currentDraft, { errorsCount: e.target.value })}
                          disabled={!canSubmit}
                        />
                      </label>
                      <label className="field">
                        <span>Tiempo (seg)</span>
                        <input
                          type="number"
                          min={0}
                          className={needsTime ? 'inputInvalid' : undefined}
                          value={timeValue}
                          onChange={(e) => patchAttemptDraft(t.id, currentDraft, { timeSec: e.target.value })}
                          disabled={!canSubmit}
                        />
                        {needsTime ? <span className="hint">Falta el tiempo (esta tarea tiene tiempo objetivo).</span> : null}
                      </label>
                    </div>
                    <label className="field">
                      <span>Pasos</span>
                      <input
                        type="number"
                        min={0}
                        className={needsSteps ? 'inputInvalid' : undefined}
                        value={stepsValue}
                        onChange={(e) => patchAttemptDraft(t.id, currentDraft, { stepsCount: e.target.value })}
                        disabled={!canSubmit}
                      />
                      {needsSteps ? <span className="hint">Faltan los pasos (esta tarea tiene pasos objetivo).</span> : null}
                    </label>
                    <label className="field">
                      <span>Notas (opcional)</span>
                      <textarea
                        value={notesValue}
                        onChange={(e) => patchAttemptDraft(t.id, currentDraft, { notes: e.target.value })}
                        disabled={!canSubmit}
                      />
                    </label>
                    <div className="pillRow">
                      <button
                        type="button"
                        className="btn"
                        disabled={!canSubmit || savingTaskId === t.id || saveBlockedReason !== null || isUpToDate}
                        title={
                          !canSubmit
                            ? 'No tienes permisos para guardar.'
                            : saveBlockedReason ?? (isUpToDate ? 'Este intento ya está guardado.' : undefined)
                        }
                        onClick={() => onSaveTaskAttempt(t)}
                      >
                        {savingTaskId === t.id ? 'Guardando…' : isUpToDate ? 'Guardada' : 'Guardar tarea'}
                      </button>
                      {draft ? (
                        <button type="button" className="btn btnSecondary" onClick={() => clearAttemptDraft(t.id)}>
                          Restablecer
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const renderQuestionnaireCard = () => {
      const questionnaire = questionnaireInterface;
      if (!questionnaire) {
        return (
          <div className="subCard" ref={questionnaireSectionRef}>
            <h3>Cuestionario</h3>
            <div className="alert">
              {canSubmit ? 'Selecciona una interfaz para responder.' : 'Selecciona una interfaz para ver sus preguntas.'}
            </div>
          </div>
        );
      }

      if (questionnaire.questions.length === 0) {
        return (
          <div className="subCard" ref={questionnaireSectionRef}>
            <h3>Cuestionario</h3>
            <div className="muted">No hay preguntas definidas para esta interfaz.</div>
          </div>
        );
      }

      if (!canSubmit) {
        return (
          <div className="subCard" ref={questionnaireSectionRef}>
            <h3>Cuestionario (vista previa)</h3>
            <div className="muted">
              {isAdmin
                ? 'El administrador solo visualiza el cuestionario. Ingresa como evaluador para responder.'
                : 'Solo un evaluador asignado puede responder y guardar.'}
            </div>
            <div className="stack">
              {questionnaire.questions.map((q) => (
                <div key={q.id} id={`question-${q.id}`} className="card">
                  <div className="pillRow">
                    <span className="cardTitle">{q.prompt}</span>
                    <span className={dimensionPillClass(q.dimension)}>{fmtDimension(q.dimension)}</span>
                    <span className={typePillClass(q.type)}>{fmtQuestionType(q.type)}</span>
                    {q.isRequired ? <span className="pill">Obligatoria</span> : <span className="pill">Opcional</span>}
                  </div>
                  {q.helpText ? <div className="muted">{q.helpText}</div> : null}
                </div>
              ))}
            </div>
          </div>
        );
      }

      const fingerprint = answersFingerprint(questionnaire.questions, questionnaireAnswers);
      const isUpToDate = savedAnswersFingerprintByInterfaceId[questionnaire.id] === fingerprint;
      const isLocked = lockedInterfaceIds.has(questionnaire.id);
      const isLoadingSaved = loadingSavedAnswersInterfaceId === questionnaire.id;
      const inputsDisabled = !canSubmit || savingAnswers || isLocked || isLoadingSaved;

      const setAnswer = (questionId: number, value: unknown) => {
        if (isLocked) return;
        setAnswersByInterface((s) => ({
          ...s,
          [questionnaire.id]: {
            ...(s[questionnaire.id] ?? {}),
            [questionId]: value,
          },
        }));
      };

      return (
        <div className="subCard" ref={questionnaireSectionRef}>
          <h3>Cuestionario</h3>
          {actionError ? <div className="alert">{actionError}</div> : null}
          {isLocked ? <div className="muted">Respuestas guardadas. No se pueden editar.</div> : null}
          {isLoadingSaved ? <div className="muted">Cargando respuestas guardadas…</div> : null}
          <div className="form">
            {questionnaire.questions.map((q) => (
              <label key={q.id} id={`question-${q.id}`} className="field">
                <span>
                  {q.prompt} <span className={dimensionPillClass(q.dimension)}>{fmtDimension(q.dimension)}</span>
                </span>
                {q.helpText ? <span className="muted">{q.helpText}</span> : null}
                {q.type === 'LIKERT_1_5' ? (
                  <select
                    value={(questionnaireAnswers[q.id] as number | string | undefined) ?? ''}
                    onChange={(e) => setAnswer(q.id, e.target.value === '' ? '' : Number(e.target.value))}
                    required={q.isRequired}
                    disabled={inputsDisabled}
                  >
                    <option value="" disabled>
                      Selecciona
                    </option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                ) : null}
                {q.type === 'NUMBER' ? (
                  <input
                    type="number"
                    value={(questionnaireAnswers[q.id] as number | string | undefined) ?? ''}
                    onChange={(e) => setAnswer(q.id, e.target.value === '' ? '' : Number(e.target.value))}
                    required={q.isRequired}
                    disabled={inputsDisabled}
                  />
                ) : null}
                {q.type === 'BOOLEAN' ? (
                  <select
                    value={questionnaireAnswers[q.id] === true ? 'true' : questionnaireAnswers[q.id] === false ? 'false' : ''}
                    onChange={(e) => setAnswer(q.id, e.target.value === '' ? '' : e.target.value === 'true')}
                    required={q.isRequired}
                    disabled={inputsDisabled}
                  >
                    <option value="" disabled>
                      Selecciona
                    </option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                ) : null}
                {q.type === 'TEXT' ? (
                  <textarea
                    value={(questionnaireAnswers[q.id] as string | undefined) ?? ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    required={q.isRequired}
                    disabled={inputsDisabled}
                  />
                ) : null}
              </label>
            ))}
            <button
              type="button"
              className="btn"
              onClick={onSubmitAnswers}
              disabled={savingAnswers || isLocked || isUpToDate || !canSubmit}
              title={
                !canSubmit
                  ? 'No tienes permisos para guardar.'
                  : isLocked || isUpToDate
                    ? 'Ya guardaste estas respuestas.'
                    : undefined
              }
            >
              {savingAnswers ? 'Guardando…' : isLocked || isUpToDate ? 'Guardado' : 'Guardar respuestas'}
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="splitPane">
        <div className="card stickyPane">
          <h2>{canSubmit ? 'Mi interfaz' : 'Selecciona interfaz'}</h2>
          {renderLeftPane()}
        </div>
        <div className="card">
          <h2>Evaluación</h2>
          {interfaces.length === 0 ? (
            <div className="muted">Agrega una interfaz para empezar.</div>
          ) : (
            <>
              {renderSessionCard()}
              {renderTaskAttemptsCard()}
              {renderQuestionnaireCard()}
            </>
          )}
        </div>
      </div>
    );
  }

  function renderResultsStep() {
    const evaluation = ev;
    if (!evaluation) return null;

    const result = evaluation.result ?? null;

    const barContainerStyle = { height: 10, background: 'var(--border)', borderRadius: 6 } as const;
    const barStyle = (value01: number, background: string) =>
      ({
        height: 10,
        width: `${Math.round(value01 * 100)}%`,
        background,
        borderRadius: 6,
      }) as const;

    const renderHeader = () => (
      <div className="pageHeader">
        <h2>Resultados</h2>
        <div className="pillRow">
          <button className="btn btnSecondary" onClick={onDownloadReport} disabled={downloadingReport}>
            {downloadingReport ? 'Preparando…' : 'Descargar PDF'}
          </button>
          <button className="btn btnSecondary" onClick={onPrintReport}>
            Imprimir / PDF
          </button>
          {canManage ? (
            <button
              className="btn btnSecondary"
              onClick={onCompute}
              disabled={
                computing ||
                loadingCompleteness ||
                !completeness ||
                !completeness.summary.hasStructure ||
                !completeness.summary.hasAnyData
              }
            >
              {computing
                ? 'Calculando…'
                : !completeness || loadingCompleteness
                  ? 'Cargando checklist…'
                  : 'Calcular resultados'}
            </button>
          ) : null}
        </div>
      </div>
    );

    const renderScoringWeightsCard = () => {
      if (!canManage) return null;
      const evaluation = ev;
      const effectivenessRaw = scoringWeightsDraft.effectiveness.trim();
      const efficiencyRaw = scoringWeightsDraft.efficiency.trim();
      const satisfactionRaw = scoringWeightsDraft.satisfaction.trim();
      const effectiveness = Number(effectivenessRaw);
      const efficiency = Number(efficiencyRaw);
      const satisfaction = Number(satisfactionRaw);
      const isValid =
        Boolean(effectivenessRaw) &&
        Boolean(efficiencyRaw) &&
        Boolean(satisfactionRaw) &&
        !Number.isNaN(effectiveness) &&
        !Number.isNaN(efficiency) &&
        !Number.isNaN(satisfaction) &&
        effectiveness >= 0 &&
        efficiency >= 0 &&
        satisfaction >= 0;
      const eps = 1e-9;
      const isUpToDate =
        !evaluation || !isValid
          ? false
          : Math.abs(effectiveness - evaluation.scoringWeightEffectiveness) <= eps &&
            Math.abs(efficiency - evaluation.scoringWeightEfficiency) <= eps &&
            Math.abs(satisfaction - evaluation.scoringWeightSatisfaction) <= eps;
      return (
        <div className="card">
          <div className="pageHeader">
            <h3>Pesos de scoring</h3>
            <button
              type="button"
              className="btn btnSecondary"
              onClick={onSaveScoringWeights}
              disabled={savingScoringWeights || !isValid || isUpToDate}
            >
              {savingScoringWeights ? 'Guardando…' : isUpToDate ? 'Guardado' : 'Guardar pesos'}
            </button>
          </div>
          <div className="grid2">
            <label className="field">
              <span>Efectividad</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={scoringWeightsDraft.effectiveness}
                onChange={(e) => setScoringWeightsDraft((s) => ({ ...s, effectiveness: e.target.value }))}
                disabled={savingScoringWeights}
              />
            </label>
            <label className="field">
              <span>Eficiencia</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={scoringWeightsDraft.efficiency}
                onChange={(e) => setScoringWeightsDraft((s) => ({ ...s, efficiency: e.target.value }))}
                disabled={savingScoringWeights}
              />
            </label>
            <label className="field">
              <span>Satisfacción</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={scoringWeightsDraft.satisfaction}
                onChange={(e) => setScoringWeightsDraft((s) => ({ ...s, satisfaction: e.target.value }))}
                disabled={savingScoringWeights}
              />
            </label>
          </div>
          <div className="muted">
            El score global se calcula como promedio ponderado: (Efectividad*w + Eficiencia*w + Satisfacción*w) /
            suma(w).
          </div>
        </div>
      );
    };

    const renderChecklistCard = () => {
      if (!canManage) return null;

      const renderCompletenessStatus = () => {
        if (!completeness) return <div className="muted">{loadingCompleteness ? 'Cargando…' : 'Sin datos de checklist.'}</div>;

        const summary = completeness.summary;
        const status = !summary.hasStructure
          ? 'NO_STRUCTURE'
          : !summary.hasAnyData
            ? 'NO_DATA'
            : summary.hasPending
              ? 'HAS_PENDING'
              : 'READY';

        return (
          <>
            <div className="muted">
              Evaluadores: {summary.evaluatorsCount} · Respuestas: {summary.totalAnswers}
            </div>
            {completenessLoadedAt ? <div className="muted">Actualizado: {new Date(completenessLoadedAt).toLocaleString()}</div> : null}
            {status === 'NO_STRUCTURE' ? (
              <div className="alert">La evaluación no tiene preguntas. Define la estructura para poder calcular.</div>
            ) : status === 'NO_DATA' ? (
              <div className="alert">Aún no hay respuestas registradas. Completa la evaluación para poder calcular.</div>
            ) : status === 'HAS_PENDING' ? (
              <div className="alert">
                Hay pendientes (evaluadores sin interfaz seleccionada o preguntas obligatorias sin responder). Puedes
                calcular, pero el resultado puede quedar incompleto.
              </div>
            ) : (
              <div className="muted">Listo para calcular.</div>
            )}

            {summary.hasPending ? (
              <div className="stack">
                {completeness.evaluators.map((e) => (
                  <div key={e.evaluatorId} className="card">
                    <div className="pageHeader">
                      <h4>{e.evaluator.fullName ?? e.evaluator.email ?? `Evaluador ${e.evaluatorId}`}</h4>
                      <div className="pillRow">
                        <span className="pill">
                          {e.selection ? `Interfaz: ${e.selection.interfaceName}` : 'Sin interfaz seleccionada'}
                        </span>
                        <span className="pill">{e.missingRequiredAnswersCount} obligatorias sin responder</span>
                      </div>
                    </div>

                    {e.missingRequiredAnswers.length > 0 ? (
                      <div className="stack">
                        <div className="muted">Pendiente (preguntas):</div>
                        <div className="grid">
                          {e.missingRequiredAnswers.map((x) => (
                            <div key={`${x.interfaceId}:${x.questionId}`} className="pillRow">
                              <button
                                type="button"
                                className="btn btnSecondary"
                                onClick={() => goToPendingQuestion(x.interfaceId, x.questionId)}
                              >
                                Ir
                              </button>
                              <div className="muted">
                                {x.interfaceName} → {x.prompt}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        );
      };

      return (
        <div className="card">
          <div className="pageHeader">
            <h3>Checklist para calcular</h3>
            <button type="button" className="btn btnSecondary" onClick={onLoadCompleteness} disabled={loadingCompleteness}>
              {loadingCompleteness ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
          {renderCompletenessStatus()}
        </div>
      );
    };

    const renderKpis = () => {
      if (!result) return null;
      return (
        <div className="grid">
          <div className="kpi">
            <div className="kpiLabel">Efectividad</div>
            <div className="kpiValue">{percent(result.effectivenessScore)}</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Eficiencia</div>
            <div className="kpiValue">{percent(result.efficiencyScore)}</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Satisfacción</div>
            <div className="kpiValue">{percent(result.satisfactionScore)}</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Global</div>
            <div className="kpiValue">{percent(result.overallScore)}</div>
          </div>
        </div>
      );
    };

    const renderRecommendedInterface = () => {
      const eligible = interfaceBreakdown ? interfaceBreakdown.breakdown.filter((b) => b.totalAnswers > 0) : [];
      const computedBest =
        eligible.length > 0
          ? [...eligible].sort((a, b) => {
              if (a.overallScore !== b.overallScore) return b.overallScore - a.overallScore;
              if (a.totalAnswers !== b.totalAnswers) return b.totalAnswers - a.totalAnswers;
              return a.interfaceName.localeCompare(b.interfaceName);
            })[0] ?? null
          : null;

      if (!result) {
        const id = computedBest?.interfaceId ?? null;
        const intf = id ? (interfaceById.get(id) ?? null) : null;
        return (
          <div className="card">
            <h3>Interfaz recomendada</h3>
            {!id ? (
              <div className="muted">Aún no hay respuestas suficientes para recomendar.</div>
            ) : (
              <div className="pillRow">
                <span className="pill">{intf?.name ?? `Interfaz #${id}`}</span>
                <span className="muted">Mejor puntaje actual: {percent(computedBest?.overallScore ?? 0)}</span>
                {intf?.prototypeUrl ? (
                  <a className="btn btnSecondary" href={intf.prototypeUrl} target="_blank" rel="noreferrer">
                    Abrir prototipo
                  </a>
                ) : null}
              </div>
            )}
          </div>
        );
      }

      const id = result.recommendedInterfaceId ?? null;
      const intf = id ? (interfaceById.get(id) ?? null) : null;
      return (
        <div className="card">
          <h3>Interfaz recomendada</h3>
          {!id ? (
            <div className="muted">Aún no se ha recomendado una interfaz.</div>
          ) : (
            <div className="pillRow">
              <span className="pill">{intf?.name ?? `Interfaz #${id}`}</span>
              {intf?.prototypeUrl ? (
                <a className="btn btnSecondary" href={intf.prototypeUrl} target="_blank" rel="noreferrer">
                  Abrir prototipo
                </a>
              ) : null}
            </div>
          )}
        </div>
      );
    };

    const renderInterfaceBreakdown = () => {
      const emptyText = canManage
        ? 'Carga el detalle para ver los resultados por pantalla.'
        : 'Carga el detalle para ver tus resultados por pantalla.';

      const renderScoreRow = (label: string, score: number, colorVar: string) => (
        <div>
          <div className="muted">
            {label} {percent(score)}
          </div>
          <div style={barContainerStyle}>
            <div style={barStyle(score, colorVar)} />
          </div>
        </div>
      );

      return (
        <div className="card">
          <div className="pageHeader">
            <h3>Resultados por interfaz</h3>
            <button
              type="button"
              className="btn btnSecondary"
              onClick={() => {
                if (showInterfaceBreakdown) {
                  setShowInterfaceBreakdown(false);
                  return;
                }
                setShowInterfaceBreakdown(true);
                if (!interfaceBreakdown && !loadingInterfaceBreakdown) {
                  queueMicrotask(() => {
                    void onLoadInterfaceBreakdown();
                  });
                }
              }}
              disabled={loadingInterfaceBreakdown}
            >
              {loadingInterfaceBreakdown ? 'Cargando…' : showInterfaceBreakdown ? 'Ocultar detalle' : 'Ver detalle'}
            </button>
          </div>
          {showInterfaceBreakdown && interfaceBreakdown ? (
            <>
              {!result
                ? (() => {
                    const eligible = interfaceBreakdown.breakdown.filter((b) => b.totalAnswers > 0);
                    const best =
                      eligible.length > 0
                        ? [...eligible].sort((a, b) => {
                            if (a.overallScore !== b.overallScore) return b.overallScore - a.overallScore;
                            if (a.totalAnswers !== b.totalAnswers) return b.totalAnswers - a.totalAnswers;
                            return a.interfaceName.localeCompare(b.interfaceName);
                          })[0] ?? null
                        : null;

                    return best ? (
                      <div className="muted">
                        Mejor puntaje actual: {best.interfaceName} ({percent(best.overallScore)})
                      </div>
                    ) : null;
                  })()
                : null}
              <div className="muted">
                Agregado: {percent(interfaceBreakdown.aggregate.overallScore)} · Respuestas {interfaceBreakdown.aggregate.totalAnswers}{' '}
                · Intentos {interfaceBreakdown.aggregate.totalAttempts}
              </div>
              <div className="stack">
                {interfaceBreakdown.breakdown.map((b) => (
                  <div key={b.interfaceId} className="card">
                    <div className="pageHeader">
                      <div className="pillRow">
                        <div className="cardTitle">{b.interfaceName}</div>
                        {result?.recommendedInterfaceId === b.interfaceId ? <span className="pill">Recomendada</span> : null}
                      </div>
                      <div className="muted">
                        Global {percent(b.overallScore)} · Respuestas {b.totalAnswers} · Intentos {b.totalAttempts}
                      </div>
                    </div>
                    <div className="grid2">
                      {renderScoreRow('Efectividad', b.effectivenessScore, 'var(--udenar-green)')}
                      {renderScoreRow('Eficiencia', b.efficiencyScore, 'var(--udenar-yellow)')}
                      {renderScoreRow('Satisfacción', b.satisfactionScore, 'var(--udenar-red)')}
                      {renderScoreRow('Global', b.overallScore, 'var(--udenar-green-700)')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="muted">{emptyText}</div>
          )}
        </div>
      );
    };

    const renderEvaluatorBreakdown = () => {
      if (!result) return null;

      const emptyText = canManage
        ? 'Carga el detalle para ver el resultado agregado y por evaluador.'
        : 'Carga el detalle para ver tus resultados.';

      return (
        <div className="card">
          <div className="pageHeader">
            <h3>Resultados por evaluador</h3>
            <button
              type="button"
              className="btn btnSecondary"
              onClick={onLoadResultsBreakdown}
              disabled={loadingBreakdown}
            >
              {loadingBreakdown ? 'Cargando…' : 'Ver detalle'}
            </button>
          </div>
          {resultsBreakdown ? (
            <>
              <div className="muted">
                Agregado: {percent(resultsBreakdown.aggregate.overallScore)} · Respuestas: {resultsBreakdown.aggregate.totalAnswers}{' '}
                · Intentos: {resultsBreakdown.aggregate.totalAttempts}
              </div>
              {resultsBreakdown.evaluatorsSummary ? (
                <div className="muted">
                  Evaluadores: {resultsBreakdown.evaluatorsSummary.count} · Promedio Global{' '}
                  {percent(resultsBreakdown.evaluatorsSummary.average.overallScore)} · Mediana Global{' '}
                  {percent(resultsBreakdown.evaluatorsSummary.median.overallScore)}
                </div>
              ) : null}
              <div className="list">
                {resultsBreakdown.breakdown.map((b) => (
                  <div key={b.evaluatorId} className="listItem">
                    <div className="cardTitle">{b.evaluator.fullName ?? b.evaluator.email ?? `Evaluador #${b.evaluatorId}`}</div>
                    <div className="muted">
                      Global {percent(b.overallScore)} · E{percent(b.effectivenessScore)} · Ef{percent(b.efficiencyScore)} · S
                      {percent(b.satisfactionScore)} · Respuestas {b.totalAnswers} · Intentos {b.totalAttempts}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="muted">{emptyText}</div>
          )}
        </div>
      );
    };

    const renderConclusionsRecommendations = () => {
      if (!result) return null;
      return (
        <div className="grid2">
          <div>
            <h3>Conclusiones</h3>
            <pre className="pre">{result.conclusions}</pre>
          </div>
          <div>
            <h3>Recomendaciones</h3>
            <pre className="pre">{result.recommendations}</pre>
          </div>
        </div>
      );
    };

    const renderAutoConclusionsRecommendations = () => {
      if (result) return null;
      if (!interfaceBreakdown) return null;
      const eligible = interfaceBreakdown.breakdown.filter((b) => b.totalAnswers > 0);
      if (eligible.length === 0) return null;

      const best =
        [...eligible].sort((a, b) => {
          if (a.overallScore !== b.overallScore) return b.overallScore - a.overallScore;
          if (a.totalAnswers !== b.totalAnswers) return b.totalAnswers - a.totalAnswers;
          return a.interfaceName.localeCompare(b.interfaceName);
        })[0] ?? null;

      if (!best) return null;

      const fmtLevel = (score: number) => {
        if (score >= 0.8) return 'Alta';
        if (score >= 0.6) return 'Media';
        return 'Baja';
      };

      const minDim = (b: (typeof eligible)[number]) => {
        const items = [
          { k: 'Efectividad', v: b.effectivenessScore },
          { k: 'Eficiencia', v: b.efficiencyScore },
          { k: 'Satisfacción', v: b.satisfactionScore },
        ];
        return items.sort((x, y) => x.v - y.v)[0] ?? items[0]!;
      };

      const weakest = minDim(best);

      const conclusions = [
        `Con los datos actuales, la interfaz con mejor puntaje global es: ${best.interfaceName} (${percent(best.overallScore)}).`,
        `Nivel por dimensión (mejor interfaz): Efectividad ${fmtLevel(best.effectivenessScore)} (${percent(best.effectivenessScore)}), Eficiencia ${fmtLevel(best.efficiencyScore)} (${percent(best.efficiencyScore)}), Satisfacción ${fmtLevel(best.satisfactionScore)} (${percent(best.satisfactionScore)}).`,
        `Principal oportunidad de mejora en la mejor interfaz: ${weakest.k} (${percent(weakest.v)}).`,
      ].join('\n');

      const recommendations = (() => {
        const tips: Record<string, string> = {
          Efectividad:
            'Aumenta claridad de etiquetas/ayudas y reduce ambigüedad para mejorar la tasa de logro del objetivo.',
          Eficiencia: 'Reduce pasos, simplifica flujos y optimiza ubicación/visibilidad de acciones frecuentes.',
          Satisfacción: 'Mejora consistencia visual, jerarquía y feedback para hacer la experiencia más agradable.',
        };
        const lines = [
          `Recomendación prioritaria para ${best.interfaceName}: ${tips[weakest.k] ?? 'Mejorar el punto más débil.'}`,
          ...eligible
            .filter((b) => b.interfaceId !== best.interfaceId)
            .map((b) => {
              const w = minDim(b);
              return `Para ${b.interfaceName}, prioriza ${w.k} (${percent(w.v)}): ${tips[w.k] ?? 'Mejorar el punto más débil.'}`;
            }),
        ];
        return lines.join('\n');
      })();

      return (
        <div className="grid2">
          <div>
            <h3>Conclusiones</h3>
            <pre className="pre">{conclusions}</pre>
          </div>
          <div>
            <h3>Recomendaciones</h3>
            <pre className="pre">{recommendations}</pre>
          </div>
        </div>
      );
    };

    const renderUserStoriesResult = () => {
      if (!result) return null;
      return (
        <div>
          <h3>Historias de usuario</h3>
          <div className="grid">
            {result.userStories.map((s) => (
              <div key={s.id} className="card">
                <div className="pillRow">
                  <span className="pill">P{s.priority}</span>
                  {s.recommendedInterface ? (
                    <span className="pill">Recomendada: {s.recommendedInterface.name}</span>
                  ) : s.recommendedInterfaceId ? (
                    <span className="pill">
                      Recomendada: {interfaceById.get(s.recommendedInterfaceId)?.name ?? s.recommendedInterfaceId}
                    </span>
                  ) : null}
                  <span className="cardTitle">{s.title}</span>
                </div>
                <pre className="pre">{s.narrative}</pre>
                <pre className="pre">{s.acceptanceCriteria}</pre>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderTasksSummary = () => {
      if (!showTasks) return null;
      if (!result) return null;
      if (!allTasks.length) return null;
      if (allTasks.every(({ task }) => (task.attempts?.length ?? 0) === 0)) return null;

      return (
        <div>
          <h3>Resumen de tareas</h3>
          <div className="grid">
            {allTasks.map(({ interfaceName, task }) => {
              const attempt = task.attempts[0] ?? null;
              const details = (attempt
                ? [
                    `Errores: ${attempt.errorsCount}`,
                    attempt.timeSec !== null ? `Tiempo: ${attempt.timeSec}s` : null,
                    attempt.stepsCount !== null ? `Pasos: ${attempt.stepsCount}` : null,
                  ]
                : []
              )
                .filter((x): x is string => Boolean(x))
                .join(' · ');

              return (
                <div key={task.id} className="card">
                  <div className="pillRow">
                    <span className="pill">{interfaceName}</span>
                    <span className="cardTitle">{task.title}</span>
                    <span className="pill">
                      {attempt ? (attempt.completed ? 'Completada' : 'No completada') : 'Sin intento'}
                    </span>
                  </div>
                  <div className="muted">{details || '—'}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const renderEvaluatorsAndAudit = () => {
      if (!canManage) return null;
      return (
        <div className="card">
          <h3>Evaluadores</h3>
          <form className="form" onSubmit={onAssignEvaluator}>
            <label className="field">
              <span>Email del evaluador</span>
              <input
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="evaluador@demo.com"
                required
              />
            </label>
            <button className="btn" disabled={assigning}>
              {assigning ? 'Asignando…' : 'Asignar'}
            </button>
          </form>

          {evaluation.evaluators.length === 0 ? (
            <div className="muted">No hay evaluadores asignados.</div>
          ) : (
            <div className="list">
              {evaluation.evaluators.map((a) => (
                <div key={a.id} className="listItem">
                  <div className="cardTitle">{a.evaluator.fullName}</div>
                  <div className="muted">{a.evaluator.email}</div>
                  {canManage ? (
                    <button type="button" className="btn btnDanger" onClick={() => onRemoveEvaluator(a.evaluator.id)}>
                      Quitar
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    const renderAdminTopCards = () => {
      if (!canManage) return null;
      return (
        <div className="grid2">
          {renderChecklistCard()}
          {renderEvaluatorsAndAudit()}
        </div>
      );
    };

    return (
      <div className="card">
        {renderHeader()}
        {renderScoringWeightsCard()}
        {renderAdminTopCards()}

        {result ? <>{renderKpis()}</> : null}
        {renderRecommendedInterface()}
        {renderInterfaceBreakdown()}
        {result ? (
          <>
            {renderEvaluatorBreakdown()}
            {renderConclusionsRecommendations()}
            {renderUserStoriesResult()}
            {renderTasksSummary()}
          </>
        ) : (
          <>
            <div className="muted">
              Aún no hay un reporte final calculado. Puedes revisar el detalle por interfaz y usarlo para tomar una decisión.
            </div>
            {renderAutoConclusionsRecommendations()}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="stack">
      {actionError ? <div className="alert">{actionError}</div> : null}
      <div className="pageHeader">
        <div>
          <h1>{ev.title}</h1>
          <p className="muted">{ev.systemName}</p>
          {viewStep === 'userStories' && needsUserStories ? (
            <div className="muted">Empieza agregando al menos una historia de usuario.</div>
          ) : null}
          {viewStep !== 'userStories' && needsUserStories ? (
            <div className="alert">
              {canManage
                ? 'Primero debes recolectar al menos una historia de usuario para continuar.'
                : 'Aún no hay historias de usuario definidas. Espera a que el creador las configure.'}
            </div>
          ) : null}
          {viewStep === 'interfaces' && needsInterfaces ? (
            <div className="muted">Empieza agregando al menos una interfaz (pantalla).</div>
          ) : null}
          {viewStep !== 'interfaces' && viewStep !== 'userStories' && needsInterfaces ? (
            <div className="alert">
              {canManage
                ? 'Primero debes agregar al menos una interfaz para continuar.'
                : 'Aún no hay interfaces definidas. Espera a que el creador las configure.'}
            </div>
          ) : null}
          {viewStep === 'run' && needsStructure ? (
            <div className="alert">
              {canManage
                ? 'Para evaluar, agrega al menos una pregunta en “Estructura”.'
                : 'Aún no hay preguntas definidas. Espera a que el creador complete la estructura.'}
            </div>
          ) : null}
        </div>
        <div className="pillRow">
          <span className="pill">{ev.userType === 'NOVICE' ? 'Novato' : 'Experto'}</span>
          <span className={statusPillClass(ev.status)}>{fmtEvaluationStatus(ev.status)}</span>
        </div>
      </div>

      <div className="card">
        <div className="stepper">
          {steps.map((s) => {
            const isActive = s.id === viewStep;
            const enabled = canGoToStep(s.id);
            return (
              <button
                key={s.id}
                type="button"
                className={isActive ? 'stepBtn stepBtnActive' : 'stepBtn'}
                disabled={!enabled && !isActive}
                onClick={() => setStep(s.id)}
              >
                <div className="cardTitle">{s.title}</div>
                <div className="muted">{s.hint}</div>
              </button>
            );
          })}
        </div>
        <div className="pillRow">
          <button
            type="button"
            className="btn btnSecondary"
            onClick={goBack}
            disabled={!prevStep}
          >
            Atrás
          </button>
          <button
            type="button"
            className="btn"
            onClick={goNext}
            disabled={!nextStep || !canGoToStep(nextStep)}
          >
            Siguiente
          </button>
        </div>
      </div>

      {viewStep === 'userStories' ? renderUserStoriesStep() : null}

      {viewStep === 'interfaces' ? renderInterfacesStep() : null}

      {viewStep === 'structure' ? renderStructureStep() : null}

      {viewStep === 'run' ? renderRunStep() : null}

      {viewStep === 'results' ? renderResultsStep() : null}
    </div>
  );
}
