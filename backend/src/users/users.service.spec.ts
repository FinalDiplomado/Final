import { RoleName } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../auth/jwt.strategy';

type PrismaMock = {
  role: {
    findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  user: {
    findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    update: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    count: jest.MockedFunction<(args: unknown) => Promise<number>>;
    findMany: jest.MockedFunction<(args: unknown) => Promise<unknown[]>>;
  };
  auditLog: {
    create: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    role: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
}

describe('UsersService.updateRole', () => {
  it('no permite degradar al único admin', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as unknown as PrismaService);
    const actor = {
      userId: 1,
      email: 'admin@test.local',
      role: RoleName.ADMIN,
    } satisfies JwtUser;

    prisma.role.findUnique.mockResolvedValue({
      id: 2,
      name: RoleName.EVALUATOR,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 10,
      role: { name: RoleName.ADMIN },
    });
    prisma.user.count.mockResolvedValue(1);

    await expect(
      service.updateRole(actor, 10, RoleName.EVALUATOR),
    ).rejects.toThrow(
      'No se puede quitar el rol ADMIN al único administrador del sistema',
    );
  });

  it('permite degradar admin si hay más de uno', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as unknown as PrismaService);
    const actor = {
      userId: 1,
      email: 'admin@test.local',
      role: RoleName.ADMIN,
    } satisfies JwtUser;

    prisma.role.findUnique.mockResolvedValue({
      id: 2,
      name: RoleName.EVALUATOR,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 10,
      role: { name: RoleName.ADMIN },
    });
    prisma.user.count.mockResolvedValue(2);
    prisma.user.update.mockResolvedValue({
      id: 10,
      email: 'user@test.local',
      fullName: 'User',
      role: { name: RoleName.EVALUATOR },
    });
    prisma.auditLog.create.mockResolvedValue({});

    const updated = await service.updateRole(actor, 10, RoleName.EVALUATOR);

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(updated.role.name).toBe(RoleName.EVALUATOR);
  });
});
