export type Question = {
  id: number;
  dimension: 'EFFECTIVENESS' | 'EFFICIENCY' | 'SATISFACTION';
  type: 'NUMBER' | 'LIKERT_1_5' | 'TEXT' | 'BOOLEAN';
  prompt: string;
  helpText: string | null;
  isRequired: boolean;
  weight: number;
  order: number;
};

export type TaskAttempt = {
  completed: boolean;
  errorsCount: number;
  timeSec: number | null;
  stepsCount: number | null;
  notes: string | null;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  targetTimeSec: number | null;
  targetSteps: number | null;
  order: number;
  attempts: TaskAttempt[];
};

export type Interface = {
  id: number;
  name: string;
  imageUrl: string | null;
  prototypeUrl: string | null;
  order: number;
  questions: Question[];
  tasks: Task[];
};

export type UserStory = {
  id: number;
  title: string;
  narrative: string;
  acceptanceCriteria: string;
  priority: number;
  recommendedInterfaceId?: number | null;
  recommendedInterface?: { id: number; name: string } | null;
};

export type Result = {
  recommendedInterfaceId: number | null;
  effectivenessScore: number;
  efficiencyScore: number;
  satisfactionScore: number;
  overallScore: number;
  conclusions: string;
  recommendations: string;
  userStories: UserStory[];
};

export type Person = { id: number; email: string; fullName: string };

export type EvaluationEvaluator = {
  id: number;
  createdAt: string;
  evaluator: Person;
};

export type EvaluationSession = {
  id: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
};

export type ManualUserStory = {
  id: number;
  interfaceId: number | null;
  interface: { id: number; name: string } | null;
  recommendedInterfaceId?: number | null;
  recommendedInterface?: { id: number; name: string } | null;
  createdBy: Person;
  title: string;
  narrative: string;
  acceptanceCriteria: string;
  status: 'DRAFT' | 'APPROVED' | 'DONE';
  mosCow: 'MUST' | 'SHOULD' | 'COULD' | 'WONT';
  priority: number;
  riceReach: number | null;
  riceImpact: number | null;
  riceConfidence: number | null;
  riceEffort: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  createdAt: string;
  actor: Person;
};

export type Evaluation = {
  id: number;
  title: string;
  systemName: string;
  userType: 'NOVICE' | 'EXPERT';
  usageContext: string;
  scoringWeightEffectiveness: number;
  scoringWeightEfficiency: number;
  scoringWeightSatisfaction: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  createdById: number;
  interfaces: Interface[];
  result: Result | null;
  manualUserStories: ManualUserStory[];
  evaluators: EvaluationEvaluator[];
  sessions: EvaluationSession[];
};

export type ResultsBreakdown = {
  canSeeAll: boolean;
  aggregate: {
    effectivenessScore: number;
    efficiencyScore: number;
    satisfactionScore: number;
    overallScore: number;
    totalAnswers: number;
    totalAttempts: number;
  };
  evaluatorsSummary?: {
    count: number;
    average: {
      effectivenessScore: number;
      efficiencyScore: number;
      satisfactionScore: number;
      overallScore: number;
    };
    median: {
      effectivenessScore: number;
      efficiencyScore: number;
      satisfactionScore: number;
      overallScore: number;
    };
  };
  breakdown: Array<{
    evaluatorId: number;
    evaluator: { id: number; email: string | null; fullName: string | null };
    effectivenessScore: number;
    efficiencyScore: number;
    satisfactionScore: number;
    overallScore: number;
    totalAnswers: number;
    totalAttempts: number;
  }>;
};

export type InterfaceBreakdown = {
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
    selectedCount: number;
  }>;
};

export type Completeness = {
  canSeeAll: boolean;
  summary: {
    hasStructure: boolean;
    hasAnyData: boolean;
    totalAnswers: number;
    evaluatorsCount: number;
    readyToCompute: boolean;
    hasPending: boolean;
  };
  evaluators: Array<{
    evaluatorId: number;
    evaluator: { id: number; email: string | null; fullName: string | null };
    selection: { interfaceId: number; interfaceName: string } | null;
    missingRequiredAnswersCount: number;
    missingRequiredAnswers: Array<{
      interfaceId: number;
      interfaceName: string;
      questionId: number;
      prompt: string;
    }>;
  }>;
};

export type StepId = 'userStories' | 'interfaces' | 'structure' | 'run' | 'results';

export type InterfaceEdit = { name: string; imageUrl: string; prototypeUrl: string };

export type QuestionEdit = {
  dimension: Question['dimension'];
  type: Question['type'];
  prompt: string;
  helpText: string;
  isRequired: boolean;
  weight: string;
};

export type TaskEdit = { title: string; description: string; targetTimeSec: string; targetSteps: string };

export type AttemptDraft = {
  completed: '' | 'true' | 'false';
  errorsCount: string;
  timeSec: string;
  stepsCount: string;
  notes: string;
};
