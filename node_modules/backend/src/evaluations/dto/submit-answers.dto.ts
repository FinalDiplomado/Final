import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubmitAnswerItemDto {
  @Type(() => Number)
  @IsInt()
  questionId!: number;

  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  valueLikert?: number;

  @IsOptional()
  @IsString()
  valueText?: string;

  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;
}

export class SubmitAnswersDto {
  @Type(() => Number)
  @IsInt()
  interfaceId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerItemDto)
  answers!: SubmitAnswerItemDto[];
}
