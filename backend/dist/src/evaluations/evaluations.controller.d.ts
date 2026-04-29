import { StreamableFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtUser } from '../auth/jwt.strategy';
import { AddInterfaceDto } from './dto/add-interface.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { SubmitTaskAttemptDto } from './dto/submit-task-attempt.dto';
import { AssignEvaluatorDto, CreateManualUserStoryDto, EndSessionDto, SelectInterfaceDto, UpdateInterfaceDto, UpdateManualUserStoryDto, UpdateQuestionDto, UpdateScoringWeightsDto, UpdateTaskDto } from './dto/manual-modules.dto';
import { EvaluationsService } from './evaluations.service';
export declare class EvaluationsController {
    private readonly evaluations;
    constructor(evaluations: EvaluationsService);
    private getUser;
    create(req: Request & {
        user?: JwtUser;
    }, dto: CreateEvaluationDto): Promise<{
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
    listMine(req: Request & {
        user?: JwtUser;
    }): Promise<{
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
    getById(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
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
    updateScoringWeights(req: Request & {
        user?: JwtUser;
    }, id: number, dto: UpdateScoringWeightsDto): Promise<{
        id: number;
        scoringWeightEffectiveness: number;
        scoringWeightEfficiency: number;
        scoringWeightSatisfaction: number;
    }>;
    deleteEvaluation(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
        ok: boolean;
    }>;
    getReport(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
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
    getResultsBreakdown(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
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
    getInterfaceBreakdown(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
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
    getCompleteness(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
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
    addInterface(req: Request & {
        user?: JwtUser;
    }, id: number, dto: AddInterfaceDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        evaluationId: number;
        imageUrl: string | null;
        prototypeUrl: string | null;
        order: number;
    }>;
    updateInterface(req: Request & {
        user?: JwtUser;
    }, interfaceId: number, dto: UpdateInterfaceDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        evaluationId: number;
        imageUrl: string | null;
        prototypeUrl: string | null;
        order: number;
    }>;
    deleteInterface(req: Request & {
        user?: JwtUser;
    }, interfaceId: number): Promise<{
        ok: boolean;
    }>;
    addQuestion(req: Request & {
        user?: JwtUser;
    }, interfaceId: number, dto: CreateQuestionDto): Promise<{
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
    updateQuestion(req: Request & {
        user?: JwtUser;
    }, questionId: number, dto: UpdateQuestionDto): Promise<{
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
    deleteQuestion(req: Request & {
        user?: JwtUser;
    }, questionId: number): Promise<{
        ok: boolean;
    }>;
    addTask(req: Request & {
        user?: JwtUser;
    }, interfaceId: number, dto: CreateTaskDto): Promise<{
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
    updateTask(req: Request & {
        user?: JwtUser;
    }, taskId: number, dto: UpdateTaskDto): Promise<{
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
    deleteTask(req: Request & {
        user?: JwtUser;
    }, taskId: number): Promise<{
        ok: boolean;
    }>;
    submitAnswers(req: Request & {
        user?: JwtUser;
    }, id: number, dto: SubmitAnswersDto): Promise<{
        ok: boolean;
    }>;
    getMyAnswers(req: Request & {
        user?: JwtUser;
    }, id: number, interfaceId: number): Promise<{
        interfaceId: number;
        answers: {
            questionId: number;
            valueNumber: number | null;
            valueLikert: number | null;
            valueText: string | null;
            valueBoolean: boolean | null;
        }[];
    }>;
    downloadReportPdf(req: Request & {
        user?: JwtUser;
    }, id: number, res: Response): Promise<StreamableFile>;
    getMySelection(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
        createdAt: Date;
        updatedAt: Date;
        interfaceId: number;
    } | null>;
    selectInterface(req: Request & {
        user?: JwtUser;
    }, id: number, dto: SelectInterfaceDto): Promise<{
        createdAt: Date;
        updatedAt: Date;
        interfaceId: number;
    }>;
    submitTaskAttempt(req: Request & {
        user?: JwtUser;
    }, id: number, dto: SubmitTaskAttemptDto): Promise<{
        ok: boolean;
    }>;
    computeResults(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
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
    listManualUserStories(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<({
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
    createManualUserStory(req: Request & {
        user?: JwtUser;
    }, id: number, dto: CreateManualUserStoryDto): Promise<{
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
    updateManualUserStory(req: Request & {
        user?: JwtUser;
    }, id: number, storyId: number, dto: UpdateManualUserStoryDto): Promise<{
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
    deleteManualUserStory(req: Request & {
        user?: JwtUser;
    }, id: number, storyId: number): Promise<{
        ok: boolean;
    }>;
    listEvaluators(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<({
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
    assignEvaluator(req: Request & {
        user?: JwtUser;
    }, id: number, dto: AssignEvaluatorDto): Promise<{
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
    removeEvaluator(req: Request & {
        user?: JwtUser;
    }, id: number, evaluatorId: number): Promise<{
        ok: boolean;
    }>;
    startSession(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<{
        id: number;
        evaluationId: number;
        notes: string | null;
        status: import("@prisma/client").$Enums.SessionStatus;
        evaluatorId: number;
        startedAt: Date;
        endedAt: Date | null;
    }>;
    endSession(req: Request & {
        user?: JwtUser;
    }, id: number, dto: EndSessionDto): Promise<{
        id: number;
        evaluationId: number;
        notes: string | null;
        status: import("@prisma/client").$Enums.SessionStatus;
        evaluatorId: number;
        startedAt: Date;
        endedAt: Date | null;
    }>;
    listAudit(req: Request & {
        user?: JwtUser;
    }, id: number): Promise<({
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
