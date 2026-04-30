import 'dotenv/config';
import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: { name: RoleName.ADMIN },
  });

  await prisma.role.upsert({
    where: { name: RoleName.EVALUATOR },
    update: {},
    create: { name: RoleName.EVALUATOR },
  });

  const isProd = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || (isProd ? '' : 'admin@demo.com');
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminFullName =
    process.env.ADMIN_FULL_NAME?.trim() || 'Administrador';

  if (!adminEmail) throw new Error('ADMIN_EMAIL is required to seed the admin user');

  const adminRole = await prisma.role.findUnique({
    where: { name: RoleName.ADMIN },
    select: { id: true },
  });

  if (!adminRole) {
    throw new Error('ADMIN role not found after upsert');
  }

  const existingAdminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  let passwordHashToSet: string | null = null;
  if (adminPassword) {
    if (adminPassword.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters');
    }
    passwordHashToSet = await bcrypt.hash(adminPassword, 12);
  } else if (!existingAdminUser) {
    if (isProd) {
      throw new Error('ADMIN_PASSWORD is required (min 8 chars) to seed the admin user');
    }
    passwordHashToSet = await bcrypt.hash('12345678', 12);
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: adminFullName,
      roleId: adminRole.id,
      ...(passwordHashToSet ? { passwordHash: passwordHashToSet } : {}),
    },
    create: {
      email: adminEmail,
      fullName: adminFullName,
      passwordHash: passwordHashToSet ?? '',
      roleId: adminRole.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });
