import { MoSCoWPriority, QuestionType, StoryStatus, UsabilityDimension } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../auth/jwt.strategy';
import { AddInterfaceDto } from './dto/add-interface.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { SubmitTaskAttemptDto } from './dto/submit-task-attempt.dto';
export declare class EvaluationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private logEvent;
    private assertCanViewEvaluation;
    private assertCanManageEvaluation;
    private assertCanSubmitEvaluationData;
    create(user: JwtUser, dto: CreateEvaluationDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        systemName: string;
        userType: import("@prisma/client").$Enums.UserType;
        usageContext: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        scoringWeightEffectiveness: number;
        scoringWeightEfficiency: number;
        scoringWeightSatisfaction: number;
        createdById: number;
    }>;
    listMine(user: JwtUser): Promise<{
        id: number;
        result: {
            effectivenessScore: number;
            efficiencyScore: number;
            satisfactionScore: number;
            overallScore: number;
            generatedAt: Date;
        } | null;
        _count: {
            interfaces: number;
            evaluators: number;
        };
        createdAt: Date;
        updatedAt: Date;
        title: string;
        systemName: string;
        userType: import("@prisma/client").$Enums.UserType;
        usageContext: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        createdBy: {
            id: number;
            email: string;
            fullName: string;
        };
    }[]>;
    deleteEvaluation(user: JwtUser, evaluationId: number): Promise<{
        ok: boolean;
    }>;
    getById(user: JwtUser, evaluationId: number): Promise<{
        result: ({
            userStories: ({
                recommendedInterface: {
                    id: number;
                    name: string;
                } | null;
            } & {
                id: number;
                createdAt: Date;
                title: string;
                recommendedInterfaceId: number | null;
                narrative: string;
                acceptanceCriteria: string;
                priority: number;
                resultId: number;
            })[];
        } & {
            id: number;
            evaluationId: number;
            recommendedInterfaceId: number | null;
            effectivenessScore: number;
            efficiencyScore: number;
            satisfactionScore: number;
            overallScore: number;
            conclusions: string;
            recommendations: string;
            generatedAt: Date;
        }) | null;
        manualUserStories: ({
            interface: {
                id: number;
                name: string;
            } | null;
            createdBy: {
                id: number;
                email: string;
                fullName: string;
            };
            recommendedInterface: {
                id: number;
                name: string;
            } | null;
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            evaluationId: number;
            title: string;
            interfaceId: number | null;
            recommendedInterfaceId: number | null;
            narrative: string;
            acceptanceCriteria: string;
            status: import("@prisma/client").$Enums.StoryStatus;
            mosCow: import("@prisma/client").$Enums.MoSCoWPriority;
            priority: number;
            riceReach: number | null;
            riceImpact: number | null;
            riceConfidence: number | null;
            riceEffort: number | null;
            createdById: number;
        })[];
        sessions: {
            id: number;
            evaluationId: number;
            notes: string | null;
            status: import("@prisma/client").$Enums.SessionStatus;
            evaluatorId: number;
            startedAt: Date;
            endedAt: Date | null;
        }[];
        interfaces: ({
            questions: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                order: number;
                dimension: import("@prisma/client").$Enums.UsabilityDimension;
                type: import("@prisma/client").$Enums.QuestionType;
                prompt: string;
                helpText: string | null;
                isRequired: boolean;
                weight: number;
                interfaceId: number;
            }[];
            tasks: ({
                attempts: {
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    evaluationId: number;
                    taskId: number;
                    completed: boolean;
                    errorsCount: number;
                    timeSec: number | null;
                    stepsCount: number | null;
                    notes: string | null;
                    evaluatorId: number;
                }[];
            } & {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                order: number;
                title: string;
                description: string | null;
                targetTimeSec: number | null;
                targetSteps: number | null;
                interfaceId: number;
            })[];
        } & {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            evaluationId: number;
            imageUrl: string | null;
            prototypeUrl: string | null;
            order: number;
        })[];
        evaluators: ({
            evaluator: {
                id: number;
                email: string;
                fullName: string;
            };
        } & {
            id: number;
            createdAt: Date;
            evaluationId: number;
            evaluatorId: number;
            assignedById: number;
        })[];
        selections: {
            createdAt: Date;
            interfaceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        systemName: string;
        userType: import("@prisma/client").$Enums.UserType;
        usageContext: string;
        status: import("@prisma/client").$Enums.EvaluationStatus;
        scoringWeightEffectiveness: number;
        scoringWeightEfficiency: number;
        scoringWeightSatisfaction: number;
        createdById: number;
    }>;
    updateScoringWeights(user: JwtUser, evaluationId: number, dto: {
        effectiveness?: number;
        efficiency?: number;
        satisfaction?: number;
    }): Promise<{
        id: number;
        scoringWeightEffectiveness: number;
        scoringWeightEfficiency: number;
        scoringWeightSatisfaction: number;
    }>;
    getMySelection(user: JwtUser, evaluationId: number): Promise<{
        createdAt: Date;
        updatedAt: Date;
        interfaceId: number;
    } | null>;
    selectInterface(user: JwtUser, evaluationId: number, interfaceId: number): Promise<{
        createdAt: Date;
        updatedAt: Date;
        interfaceId: number;
    }>;
    getReport(user: JwtUser, evaluationId: number): Promise<{
        generatedAt: string;
        evaluation: {
            id: number;
            title: string;
            systemName: string;
            userType: import("@prisma/client").$Enums.UserType;
            usageContext: string;
            scoringWeightEffectiveness: number;
            scoringWeightEfficiency: number;
            scoringWeightSatisfaction: number;
            status: import("@prisma/client").$Enums.EvaluationStatus;
        };
        interfaces: {
            id: number;
            name: string;
            order: number;
            imageUrl: string | null;
            prototypeUrl: string | null;
            tasks: {
                id: number;
                title: string;
                description: string | null;
                order: number;
                targetTimeSec: number | null;
                targetSteps: number | null;
                attempts: {
                    completed: boolean;
                    errorsCount: number;
                    timeSec: number | null;
                    stepsCount: number | null;
                    notes: string | null;
                    createdAt: Date;
                }[];
            }[];
            questions: {
                id: number;
                dimension: import("@prisma/client").$Enums.UsabilityDimension;
                type: import("@prisma/client").$Enums.QuestionType;
                prompt: string;
                helpText: string | null;
                isRequired: boolean;
                weight: number;
            }[];
        }[];
        evaluators: ({
            evaluator: {
                id: number;
                email: string;
                fullName: string;
            };
        } & {
            id: number;
            createdAt: Date;
            evaluationId: number;
            evaluatorId: number;
            assignedById: number;
        })[];
        sessions: ({
            evaluator: {
                id: number;
                email: string;
                fullName: string;
            };
        } & {
            id: number;
            evaluationId: number;
            notes: string | null;
            status: import("@prisma/client").$Enums.SessionStatus;
            evaluatorId: number;
            startedAt: Date;
            endedAt: Date | null;
        })[];
        manualUserStories: ({
            interface: {
                id: number;
                name: string;
            } | null;
            createdBy: {
                id: number;
                email: string;
                fullName: string;
            };
            recommendedInterface: {
                id: number;
                name: string;
            } | null;
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            evaluationId: number;
            title: string;
            interfaceId: number | null;
            recommendedInterfaceId: number | null;
            narrative: string;
            acceptanceCriteria: string;
            status: import("@prisma/client").$Enums.StoryStatus;
            mosCow: import("@prisma/client").$Enums.MoSCoWPriority;
            priority: number;
            riceReach: number | null;
            riceImpact: number | null;
            riceConfidence: number | null;
            riceEffort: number | null;
            createdById: number;
        })[];
        result: ({
            userStories: ({
                recommendedInterface: {
                    id: number;
                    name: string;
                } | null;
            } & {
                id: number;
                createdAt: Date;
                title: string;
                recommendedInterfaceId: number | null;
                narrative: string;
                acceptanceCriteria: string;
                priority: number;
                resultId: number;
            })[];
        } & {
            id: number;
            evaluationId: number;
            recommendedInterfaceId: number | null;
            effectivenessScore: number;
            efficiencyScore: number;
            satisfactionScore: number;
            overallScore: number;
            conclusions: string;
            recommendations: string;
            generatedAt: Date;
        }) | null;
    }>;
    getReportPdf(user: JwtUser, evaluationId: number): Promise<Buffer<ArrayBuffer>>;
    addInterface(user: JwtUser, evaluationId: number, dto: AddInterfaceDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        evaluationId: number;
        imageUrl: string | null;
        prototypeUrl: string | null;
        order: number;
    }>;
    addQuestion(user: JwtUser, interfaceId: number, dto: CreateQuestionDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        dimension: import("@prisma/client").$Enums.UsabilityDimension;
        type: import("@prisma/client").$Enums.QuestionType;
        prompt: string;
        helpText: string | null;
        isRequired: boolean;
        weight: number;
        interfaceId: number;
    }>;
    addTask(user: JwtUser, interfaceId: number, dto: CreateTaskDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        title: string;
        description: string | null;
        targetTimeSec: number | null;
        targetSteps: number | null;
        interfaceId: number;
    }>;
    updateInterface(user: JwtUser, interfaceId: number, dto: {
        name?: string;
        imageUrl?: string;
        prototypeUrl?: string;
        order?: number;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        evaluationId: number;
        imageUrl: string | null;
        prototypeUrl: string | null;
        order: number;
    }>;
    deleteInterface(user: JwtUser, interfaceId: number): Promise<{
        ok: boolean;
    }>;
    updateTask(user: JwtUser, taskId: number, dto: {
        title?: string;
        description?: string;
        targetTimeSec?: number;
        targetSteps?: number;
        order?: number;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        title: string;
        description: string | null;
        targetTimeSec: number | null;
        targetSteps: number | null;
        interfaceId: number;
    }>;
    deleteTask(user: JwtUser, taskId: number): Promise<{
        ok: boolean;
    }>;
    updateQuestion(user: JwtUser, questionId: number, dto: {
        dimension?: UsabilityDimension;
        type?: QuestionType;
        prompt?: string;
        helpText?: string;
        isRequired?: boolean;
        weight?: number;
        order?: number;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        dimension: import("@prisma/client").$Enums.UsabilityDimension;
        type: import("@prisma/client").$Enums.QuestionType;
        prompt: string;
        helpText: string | null;
        isRequired: boolean;
        weight: number;
        interfaceId: number;
    }>;
    deleteQuestion(user: JwtUser, questionId: number): Promise<{
        ok: boolean;
    }>;
    submitAnswers(user: JwtUser, evaluationId: number, dto: SubmitAnswersDto): Promise<{
        ok: boolean;
    }>;
    getMyAnswers(user: JwtUser, evaluationId: number, interfaceId: number): Promise<{
        interfaceId: number;
        answers: {
            questionId: number;
            valueNumber: number | null;
            valueLikert: number | null;
            valueText: string | null;
            valueBoolean: boolean | null;
        }[];
    }>;
    submitTaskAttempt(user: JwtUser, evaluationId: number, dto: SubmitTaskAttemptDto): Promise<{
        ok: boolean;
    }>;
    computeResults(user: JwtUser, evaluationId: number): Promise<{
        result: ({
            userStories: ({
                recommendedInterface: {
                    id: number;
                    name: string;
                } | null;
            } & {
                id: number;
                createdAt: Date;
                title: string;
                recommendedInterfaceId: number | null;
                narrative: string;
                acceptanceCriteria: string;
                priority: number;
                resultId: number;
            })[];
        } & {
            id: number;
            evaluationId: number;
            recommendedInterfaceId: number | null;
            effectivenessScore: number;
            efficiencyScore: number;
            satisfactionScore: number;
            overallScore: number;
            conclusions: string;
            recommendations: string;
            generatedAt: Date;
        }) | null;
        userStoriesCreated: number;
    }>;
    listManualUserStories(user: JwtUser, evaluationId: number): Promise<({
        interface: {
            id: number;
            name: string;
        } | null;
        createdBy: {
            id: number;
            email: string;
            fullName: string;
        };
        recommendedInterface: {
            id: number;
            name: string;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        evaluationId: number;
        title: string;
        interfaceId: number | null;
        recommendedInterfaceId: number | null;
        narrative: string;
        acceptanceCriteria: string;
        status: import("@prisma/client").$Enums.StoryStatus;
        mosCow: import("@prisma/client").$Enums.MoSCoWPriority;
        priority: number;
        riceReach: number | null;
        riceImpact: number | null;
        riceConfidence: number | null;
        riceEffort: number | null;
        createdById: number;
    })[]>;
    createManualUserStory(user: JwtUser, evaluationId: number, dto: {
        interfaceId?: number;
        recommendedInterfaceId?: number;
        title: string;
        narrative: string;
        acceptanceCriteria: string;
        status?: StoryStatus;
        mosCow?: MoSCoWPriority;
        priority?: number;
        riceReach?: number;
        riceImpact?: number;
        riceConfidence?: number;
        riceEffort?: number;
    }): Promise<{
        interface: {
            id: number;
            name: string;
        } | null;
        createdBy: {
            id: number;
            email: string;
            fullName: string;
        };
        recommendedInterface: {
            id: number;
            name: string;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        evaluationId: number;
        title: string;
        interfaceId: number | null;
        recommendedInterfaceId: number | null;
        narrative: string;
        acceptanceCriteria: string;
        status: import("@prisma/client").$Enums.StoryStatus;
        mosCow: import("@prisma/client").$Enums.MoSCoWPriority;
        priority: number;
        riceReach: number | null;
        riceImpact: number | null;
        riceConfidence: number | null;
        riceEffort: number | null;
        createdById: number;
    }>;
    updateManualUserStory(user: JwtUser, evaluationId: number, storyId: number, dto: Partial<{
        interfaceId: number | null;
        recommendedInterfaceId: number | null;
        title: string;
        narrative: string;
        acceptanceCriteria: string;
        status: StoryStatus;
        mosCow: MoSCoWPriority;
        priority: number;
        riceReach: number | null;
        riceImpact: number | null;
        riceConfidence: number | null;
        riceEffort: number | null;
    }>): Promise<{
        interface: {
            id: number;
            name: string;
        } | null;
        createdBy: {
            id: number;
            email: string;
            fullName: string;
        };
        recommendedInterface: {
            id: number;
            name: string;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        evaluationId: number;
        title: string;
        interfaceId: number | null;
        recommendedInterfaceId: number | null;
        narrative: string;
        acceptanceCriteria: string;
        status: import("@prisma/client").$Enums.StoryStatus;
        mosCow: import("@prisma/client").$Enums.MoSCoWPriority;
        priority: number;
        riceReach: number | null;
        riceImpact: number | null;
        riceConfidence: number | null;
        riceEffort: number | null;
        createdById: number;
    }>;
    deleteManualUserStory(user: JwtUser, evaluationId: number, storyId: number): Promise<{
        ok: boolean;
    }>;
    listEvaluators(user: JwtUser, evaluationId: number): Promise<({
        evaluator: {
            id: number;
            email: string;
            fullName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        evaluationId: number;
        evaluatorId: number;
        assignedById: number;
    })[]>;
    assignEvaluatorByEmail(user: JwtUser, evaluationId: number, email: string): Promise<{
        evaluator: {
            id: number;
            email: string;
            fullName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        evaluationId: number;
        evaluatorId: number;
        assignedById: number;
    }>;
    removeEvaluator(user: JwtUser, evaluationId: number, evaluatorId: number): Promise<{
        ok: boolean;
    }>;
    startSession(user: JwtUser, evaluationId: number): Promise<{
        id: number;
        evaluationId: number;
        notes: string | null;
        status: import("@prisma/client").$Enums.SessionStatus;
        evaluatorId: number;
        startedAt: Date;
        endedAt: Date | null;
    }>;
    endSession(user: JwtUser, evaluationId: number, notes?: string): Promise<{
        id: number;
        evaluationId: number;
        notes: string | null;
        status: import("@prisma/client").$Enums.SessionStatus;
        evaluatorId: number;
        startedAt: Date;
        endedAt: Date | null;
    }>;
    private computeMetrics;
    getResultsBreakdown(user: JwtUser, evaluationId: number): Promise<{
        canSeeAll: boolean;
        breakdown: {
            effectivenessScore: number;
            efficiencyScore: number;
            satisfactionScore: number;
            overallScore: number;
            totalAnswers: number;
            totalAttempts: number;
            evaluatorId: number;
            evaluator: {
                id: number;
                email: string;
                fullName: string;
            } | {
                id: number;
                email: null;
                fullName: null;
            };
        }[];
        aggregate: {
            effectivenessScore: number;
            efficiencyScore: number;
            satisfactionScore: number;
            overallScore: number;
            totalAnswers: number;
            totalAttempts: number;
        };
        evaluatorsSummary: {
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
    }>;
    getInterfaceBreakdown(user: JwtUser, evaluationId: number): Promise<{
        canSeeAll: boolean;
        breakdown: {
            selectedCount: number;
            effectivenessScore: number;
            efficiencyScore: number;
            satisfactionScore: number;
            overallScore: number;
            totalAnswers: number;
            totalAttempts: number;
            interfaceId: number;
            interfaceName: string;
        }[];
        aggregate: {
            effectivenessScore: number;
            efficiencyScore: number;
            satisfactionScore: number;
            overallScore: number;
            totalAnswers: number;
            totalAttempts: number;
        };
    }>;
    getCompleteness(user: JwtUser, evaluationId: number): Promise<{
        canSeeAll: boolean;
        summary: {
            hasStructure: boolean;
            hasAnyData: boolean;
            totalAnswers: number;
            evaluatorsCount: number;
            readyToCompute: boolean;
            hasPending: boolean;
        };
        evaluators: {
            evaluatorId: number;
            evaluator: {
                id: number;
                email: string;
                fullName: string;
            } | {
                id: number;
                email: null;
                fullName: null;
            };
            selection: {
                interfaceId: number;
                interfaceName: string;
            } | null;
            missingRequiredAnswersCount: number;
            missingRequiredAnswers: {
                interfaceId: number;
                interfaceName: string;
                questionId: number;
                prompt: string;
            }[];
        }[];
    }>;
    listAudit(user: JwtUser, evaluationId: number): Promise<({
        actor: {
            id: number;
            email: string;
            fullName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        action: string;
        entityType: string;
        entityId: number | null;
        evaluationId: number | null;
        actorId: number;
    })[]>;
}
