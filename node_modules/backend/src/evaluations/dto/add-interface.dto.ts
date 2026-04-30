import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddInterfaceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3_000_000)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  prototypeUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
