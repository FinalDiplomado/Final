export declare class SubmitAnswerItemDto {
    questionId: number;
    valueNumber?: number;
    valueLikert?: number;
    valueText?: string;
    valueBoolean?: boolean;
}
export declare class SubmitAnswersDto {
    interfaceId: number;
    answers: SubmitAnswerItemDto[];
}
