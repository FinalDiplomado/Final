import { QuestionType, UsabilityDimension } from '@prisma/client';
export declare class CreateQuestionDto {
    dimension: UsabilityDimension;
    type: QuestionType;
    prompt: string;
    helpText?: string;
    isRequired?: boolean;
    weight?: number;
}
