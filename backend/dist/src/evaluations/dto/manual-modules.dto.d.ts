import { MoSCoWPriority, QuestionType, StoryStatus, UsabilityDimension } from '@prisma/client';
export declare class AssignEvaluatorDto {
    email: string;
}
export declare class SelectInterfaceDto {
    interfaceId: number;
}
export declare class StartSessionDto {
}
export declare class EndSessionDto {
    notes?: string;
}
export declare class CreateManualUserStoryDto {
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
}
export declare class UpdateManualUserStoryDto {
    interfaceId?: number;
    recommendedInterfaceId?: number;
    title?: string;
    narrative?: string;
    acceptanceCriteria?: string;
    status?: StoryStatus;
    mosCow?: MoSCoWPriority;
    priority?: number;
    riceReach?: number;
    riceImpact?: number;
    riceConfidence?: number;
    riceEffort?: number;
}
export declare class UpdateInterfaceDto {
    name?: string;
    imageUrl?: string;
    prototypeUrl?: string;
    order?: number;
}
export declare class UpdateScoringWeightsDto {
    effectiveness?: number;
    efficiency?: number;
    satisfaction?: number;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    targetTimeSec?: number;
    targetSteps?: number;
    order?: number;
}
export declare class UpdateQuestionDto {
    dimension?: UsabilityDimension;
    type?: QuestionType;
    prompt?: string;
    helpText?: string;
    isRequired?: boolean;
    weight?: number;
    order?: number;
}
