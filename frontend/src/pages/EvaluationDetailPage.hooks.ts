import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { AuthUser } from '../lib/auth';
import type { AttemptDraft, Evaluation } from './EvaluationDetailPage.types';

export function useEvaluationPermissions(user: AuthUser | null, ev: Evaluation | null) {
  const isAdmin = user?.role.name === 'ADMIN';
  const userId = user?.id ?? null;
  const canManage = Boolean(isAdmin || (user && ev ? ev.createdById === user.id : false));
  const isAssignedEvaluator = userId ? (ev?.evaluators.some((e) => e.evaluator.id === userId) ?? false) : false;
  const canSubmit = !isAdmin && isAssignedEvaluator;

  return { canManage, isAdmin, userId, isAssignedEvaluator, canSubmit };
}

export function useEvaluationDraftPersistence(args: {
  draftKey: string;
  selectedInterfaceId: number | null;
  setSelectedInterfaceId: Dispatch<SetStateAction<number | null>>;
  attemptDrafts: Record<number, AttemptDraft>;
  setAttemptDrafts: Dispatch<SetStateAction<Record<number, AttemptDraft>>>;
  answersByInterface: Record<number, Record<number, unknown>>;
  setAnswersByInterface: Dispatch<SetStateAction<Record<number, Record<number, unknown>>>>;
}) {
  const {
    draftKey,
    selectedInterfaceId,
    setSelectedInterfaceId,
    attemptDrafts,
    setAttemptDrafts,
    answersByInterface,
    setAnswersByInterface,
  } = args;

  const loadedDraftKeyRef = useRef<string | null>(null);
  const draftReadyRef = useRef(false);

  useEffect(() => {
    if (loadedDraftKeyRef.current === draftKey) return;
    loadedDraftKeyRef.current = draftKey;
    draftReadyRef.current = false;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return;
      const data = parsed as {
        selectedInterfaceId?: unknown;
        attemptDrafts?: unknown;
        answersByInterface?: unknown;
      };

      queueMicrotask(() => {
        if (typeof data.selectedInterfaceId === 'number' || data.selectedInterfaceId === null) {
          setSelectedInterfaceId(data.selectedInterfaceId as number | null);
        }

        if (data.attemptDrafts && typeof data.attemptDrafts === 'object') {
          setAttemptDrafts(data.attemptDrafts as Record<number, AttemptDraft>);
        }

        if (data.answersByInterface && typeof data.answersByInterface === 'object') {
          setAnswersByInterface(data.answersByInterface as Record<number, Record<number, unknown>>);
        }

        draftReadyRef.current = true;
      });
    } catch (err) {
      void err;
    } finally {
      if (!draftReadyRef.current) draftReadyRef.current = true;
    }
  }, [draftKey, setSelectedInterfaceId, setAttemptDrafts, setAnswersByInterface]);

  useEffect(() => {
    if (!draftReadyRef.current) return;
    try {
      const payload = {
        version: 1,
        updatedAt: Date.now(),
        selectedInterfaceId,
        attemptDrafts,
        answersByInterface,
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch (err) {
      void err;
    }
  }, [draftKey, selectedInterfaceId, attemptDrafts, answersByInterface]);
}
