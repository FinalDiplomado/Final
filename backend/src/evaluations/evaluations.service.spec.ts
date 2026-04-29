import {
  EvaluationStatus,
  RoleName,
  QuestionType,
  UsabilityDimension,
} from '@prisma/client';
import { EvaluationsService } from './evaluations.service';
import { JwtUser } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

type TaskAttemptRow = {
  completed: boolean;
  errorsCount: number;
  timeSec: number | null;
  stepsCount: number | null;
};

type TaskRow = {
  id: number;
  title: string | null;
  targetTimeSec: number | null;
  targetSteps: number | null;
  attempts: TaskAttemptRow[];
};

type QuestionRow = {
  id: number;
  dimension: UsabilityDimension;
  type: QuestionType;
  weight: number;
  prompt: string;
};

type AnswerRow = {
  interfaceId: number;
  questionId: number;
  valueNumber: number | null;
  valueLikert: number | null;
  valueBoolean: boolean | null;
};

type ResultUpsertArgs = {
  where: { evaluationId: number };
  update: {
    recommendedInterfaceId?: number | null;
    effectivenessScore: number;
    efficiencyScore: number;
    satisfactionScore: number;
    overallScore: number;
    conclusions: string;
    recommendations: string;
  };
  create: {
    evaluationId: number;
    recommendedInterfaceId?: number | null;
    effectivenessScore: number;
    efficiencyScore: number;
    satisfactionScore: number;
    overallScore: number;
    conclusions: string;
    recommendations: string;
  };
  include: unknown;
};

type UserStoryCreateManyArgs = {
  data: Array<{
    title: string;
    narrative: string;
    acceptanceCriteria: string;
    priority: number;
    resultId: number;
    recommendedInterfaceId?: number | null;
  }>;
};

type PrismaMock = {
  evaluation: {
    findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    update: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    updateMany: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  auditLog: {
    create: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  interface: {
    findMany: jest.MockedFunction<(args: unknown) => Promise<unknown[]>>;
  };
  user: {
    findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  evaluationEvaluator: {
    upsert: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  task: {
    findMany: jest.MockedFunction<(args: unknown) => Promise<TaskRow[]>>;
    findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  taskAttempt: {
    upsert: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  question: {
    findMany: jest.MockedFunction<(args: unknown) => Promise<QuestionRow[]>>;
  };
  answer: {
    findMany: jest.MockedFunction<(args: unknown) => Promise<AnswerRow[]>>;
  };
  result: {
    upsert: jest.MockedFunction<
      (
        args: ResultUpsertArgs,
      ) => Promise<{ id: number; userStories: unknown[] }>
    >;
    findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  userStory: {
    deleteMany: jest.MockedFunction<
      (args: unknown) => Promise<{ count: number }>
    >;
    createMany: jest.MockedFunction<
      (args: UserStoryCreateManyArgs) => Promise<{ count: number }>
    >;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    evaluation: {
      findUnique: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({
          createdById: 1,
          evaluators: [],
          scoringWeightEffectiveness: 1,
          scoringWeightEfficiency: 1,
          scoringWeightSatisfaction: 1,
        });
      }),
      update: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({});
      }),
      updateMany: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({ count: 0 });
      }),
    },
    auditLog: {
      create: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({});
      }),
    },
    interface: {
      findMany: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve([]);
      }),
    },
    user: {
      findUnique: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({});
      }),
    },
    evaluationEvaluator: {
      upsert: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({ id: 1, evaluator: { id: 2, email: '', fullName: '' } });
      }),
    },
    task: {
      findMany: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve([]);
      }),
      findUnique: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({});
      }),
    },
    taskAttempt: {
      upsert: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({});
      }),
    },
    question: {
      findMany: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve([]);
      }),
    },
    answer: {
      findMany: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve([]);
      }),
    },
    result: {
      upsert: jest.fn((args: ResultUpsertArgs) => {
        void args;
        return Promise.resolve({ id: 0, userStories: [] });
      }),
      findUnique: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({});
      }),
    },
    userStory: {
      deleteMany: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({ count: 0 });
      }),
      createMany: jest.fn((args: UserStoryCreateManyArgs) => {
        void args;
        return Promise.resolve({ count: 0 });
      }),
    },
  };
}

describe('EvaluationsService.computeResults', () => {
  it('calcula scores y genera historias dinámicas según métricas y focos', async () => {
    const prisma = createPrismaMock();
    const service = new EvaluationsService(prisma as unknown as PrismaService);
    const user = {
      userId: 1,
      email: 'admin@test.local',
      role: RoleName.ADMIN,
    } satisfies JwtUser;

    prisma.interface.findMany.mockResolvedValue([
      {
        id: 10,
        name: 'Pantalla A',
        order: 0,
        questions: [
          {
            id: 1,
            dimension: UsabilityDimension.SATISFACTION,
            type: QuestionType.LIKERT_1_5,
            weight: 2,
            prompt: 'El sistema es agradable de usar',
          },
          {
            id: 2,
            dimension: UsabilityDimension.SATISFACTION,
            type: QuestionType.LIKERT_1_5,
            weight: 1,
            prompt: 'Me siento en control al usar el sistema',
          },
        ],
      },
    ]);

    prisma.answer.findMany.mockResolvedValue([
      {
        interfaceId: 10,
        questionId: 1,
        valueNumber: null,
        valueLikert: 5,
        valueBoolean: null,
      },
      {
        interfaceId: 10,
        questionId: 2,
        valueNumber: null,
        valueLikert: 1,
        valueBoolean: null,
      },
    ]);

    prisma.result.upsert.mockResolvedValue({ id: 99, userStories: [] });
    prisma.userStory.deleteMany.mockResolvedValue({ count: 0 });
    prisma.userStory.createMany.mockResolvedValue({ count: 3 });
    prisma.evaluation.update.mockResolvedValue({ id: 123 });
    prisma.result.findUnique.mockResolvedValue({
      id: 99,
      evaluationId: 123,
      effectivenessScore: 0.5,
      efficiencyScore: 0.25,
      satisfactionScore: 2 / 3,
      overallScore: 0,
      conclusions: '',
      recommendations: '',
      userStories: [],
    });

    const res = await service.computeResults(user, 123);

    expect(prisma.result.upsert).toHaveBeenCalledTimes(1);
    const upsertArg = prisma.result.upsert.mock.calls[0]?.[0];
    if (!upsertArg) throw new Error('Expected upsert to be called');
    expect(upsertArg.update.effectivenessScore).toBeCloseTo(0, 5);
    expect(upsertArg.update.efficiencyScore).toBeCloseTo(0, 5);
    expect(upsertArg.update.satisfactionScore).toBeCloseTo(2 / 3, 5);
    expect(upsertArg.update.overallScore).toBeCloseTo((0 + 0 + 2 / 3) / 3, 5);

    expect(prisma.userStory.createMany).toHaveBeenCalledTimes(1);
    const createManyArg = prisma.userStory.createMany.mock.calls[0]?.[0];
    if (!createManyArg) throw new Error('Expected createMany to be called');
    expect(createManyArg.data).toHaveLength(3);
    expect(createManyArg.data[0].narrative).toContain('Como usuario');
    expect(createManyArg.data[0].recommendedInterfaceId).toBe(10);

    expect(res.userStoriesCreated).toBe(3);
    expect(res.result).toBeTruthy();
  });

  it('lanza error si no hay preguntas', async () => {
    const prisma = createPrismaMock();
    const service = new EvaluationsService(prisma as unknown as PrismaService);
    const user = {
      userId: 1,
      email: 'admin@test.local',
      role: RoleName.ADMIN,
    } satisfies JwtUser;

    prisma.interface.findMany.mockResolvedValue([]);

    await expect(service.computeResults(user, 1)).rejects.toThrow(
      'La evaluación no tiene preguntas',
    );
  });
});

describe('EvaluationsService.submitTaskAttempt (authorization)', () => {
  it('rechaza si el usuario no es admin ni está asignado como evaluador', async () => {
    const prisma = createPrismaMock();
    const service = new EvaluationsService(prisma as unknown as PrismaService);
    const user = {
      userId: 2,
      email: 'eval@test.local',
      role: RoleName.EVALUATOR,
    } satisfies JwtUser;

    prisma.evaluation.findUnique.mockResolvedValue({ evaluators: [] });

    await expect(
      service.submitTaskAttempt(user, 123, {
        taskId: 10,
        completed: true,
      }),
    ).rejects.toThrow();
  });

  it('rechaza si el usuario es admin (solo visualiza)', async () => {
    const prisma = createPrismaMock();
    const service = new EvaluationsService(prisma as unknown as PrismaService);
    const user = {
      userId: 1,
      email: 'admin@test.local',
      role: RoleName.ADMIN,
    } satisfies JwtUser;

    await expect(
      service.submitTaskAttempt(user, 123, {
        taskId: 10,
        completed: true,
      }),
    ).rejects.toThrow('El administrador no puede registrar');
  });

  it('permite guardar intento si el usuario está asignado como evaluador', async () => {
    const prisma = createPrismaMock();
    const service = new EvaluationsService(prisma as unknown as PrismaService);
    const user = {
      userId: 2,
      email: 'eval@test.local',
      role: RoleName.EVALUATOR,
    } satisfies JwtUser;

    prisma.evaluation.findUnique.mockResolvedValue({ evaluators: [{ id: 1 }] });
    prisma.task.findUnique.mockResolvedValue({
      id: 10,
      interface: { evaluationId: 123 },
    });

    const res = await service.submitTaskAttempt(user, 123, {
      taskId: 10,
      completed: true,
      errorsCount: 0,
    });

    expect(prisma.taskAttempt.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.evaluation.update).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ ok: true });
  });
});

describe('EvaluationsService.assignEvaluatorByEmail', () => {
  it('al asignar un evaluador, saca la evaluación de borrador', async () => {
    const prisma = createPrismaMock();
    const service = new EvaluationsService(prisma as unknown as PrismaService);
    const user = {
      userId: 1,
      email: 'admin@test.local',
      role: RoleName.ADMIN,
    } satisfies JwtUser;

    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      email: 'eval@test.local',
      fullName: 'Evaluador',
    });
    prisma.evaluationEvaluator.upsert.mockResolvedValue({
      id: 10,
      evaluator: { id: 2, email: 'eval@test.local', fullName: 'Evaluador' },
    });
    prisma.evaluation.updateMany.mockResolvedValue({ count: 1 });

    const res = await service.assignEvaluatorByEmail(user, 123, 'eval@test.local');

    expect(prisma.evaluationEvaluator.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.evaluation.updateMany).toHaveBeenCalledWith({
      where: { id: 123, status: EvaluationStatus.DRAFT },
      data: { status: EvaluationStatus.IN_PROGRESS },
    });
    expect(res).toEqual({
      id: 10,
      evaluator: { id: 2, email: 'eval@test.local', fullName: 'Evaluador' },
    });
  });
});
