import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { QuestionType, UsabilityDimension } from '@prisma/client';

export class CreateQuestionDto {
  @IsEnum(UsabilityDimension)
  dimension!: UsabilityDimension;

  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsString()
  prompt!: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  weight?: number;
}
