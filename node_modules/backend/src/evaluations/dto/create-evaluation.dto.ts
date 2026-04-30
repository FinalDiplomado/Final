import { IsEnum, IsString, MinLength } from 'class-validator';
import { UserType } from '@prisma/client';

export class CreateEvaluationDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(2)
  systemName!: string;

  @IsEnum(UserType)
  userType!: UserType;

  @IsString()
  @MinLength(5)
  usageContext!: string;
}
