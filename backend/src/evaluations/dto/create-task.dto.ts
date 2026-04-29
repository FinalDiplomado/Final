import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title!: string;

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
