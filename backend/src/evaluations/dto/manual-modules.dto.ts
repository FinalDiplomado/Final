import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  MoSCoWPriority,
  QuestionType,
  StoryStatus,
  UsabilityDimension,
} from '@prisma/client';

export class AssignEvaluatorDto {
  @IsEmail()
  email!: string;
}

export class SelectInterfaceDto {
  @IsInt()
  @Min(1)
  interfaceId!: number;
}

export class StartSessionDto {}

export class EndSessionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateManualUserStoryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  interfaceId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  recommendedInterfaceId?: number;

  @IsString()
  title!: string;

  @IsString()
  narrative!: string;

  @IsString()
  acceptanceCriteria!: string;

  @IsOptional()
  @IsEnum(StoryStatus)
  status?: StoryStatus;

  @IsOptional()
  @IsEnum(MoSCoWPriority)
  mosCow?: MoSCoWPriority;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  riceReach?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  riceImpact?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  riceConfidence?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  riceEffort?: number;
}

export class UpdateManualUserStoryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  interfaceId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  recommendedInterfaceId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  narrative?: string;

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @IsOptional()
  @IsEnum(StoryStatus)
  status?: StoryStatus;

  @IsOptional()
  @IsEnum(MoSCoWPriority)
  mosCow?: MoSCoWPriority;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  riceReach?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  riceImpact?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  riceConfidence?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  riceEffort?: number;
}

export class UpdateInterfaceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  prototypeUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateScoringWeightsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  effectiveness?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  efficiency?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  satisfaction?: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetTimeSec?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetSteps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsEnum(UsabilityDimension)
  dimension?: UsabilityDimension;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsString()
  prompt?: string;

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

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
