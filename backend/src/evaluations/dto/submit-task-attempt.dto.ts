import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SubmitTaskAttemptDto {
  @IsInt()
  taskId!: number;

  @IsBoolean()
  completed!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  errorsCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stepsCount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
