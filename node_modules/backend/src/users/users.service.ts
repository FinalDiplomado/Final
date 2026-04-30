import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../auth/jwt.strategy';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { name: true } },
      },
    });
  }

  async getById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateRole(actor: JwtUser, userId: number, roleName: RoleName) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      select: { id: true, name: true },
    });
    if (!role) {
      throw new BadRequestException('Rol inválido');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    const isDemotingAdmin =
      existing.role.name === RoleName.ADMIN && role.name !== RoleName.ADMIN;
    if (isDemotingAdmin) {
      const adminsCount = await this.prisma.user.count({
        where: { role: { name: RoleName.ADMIN } },
      });
      if (adminsCount <= 1) {
        throw new BadRequestException(
          'No se puede quitar el rol ADMIN al único administrador del sistema',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: { select: { name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.userId,
        action: 'CHANGE_ROLE',
        entityType: 'User',
        entityId: updated.id,
        data: {
          from: existing.role.name,
          to: role.name,
        },
      },
    });

    return updated;
  }
}
