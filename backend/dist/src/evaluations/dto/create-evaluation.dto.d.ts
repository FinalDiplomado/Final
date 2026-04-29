import { UserType } from '@prisma/client';
export declare class CreateEvaluationDto {
    title: string;
    systemName: string;
    userType: UserType;
    usageContext: string;
}
