import { RoleName } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @IsEnum(RoleName)
  roleName!: RoleName;
}
