"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.role.upsert({
        where: { name: client_1.RoleName.ADMIN },
        update: {},
        create: { name: client_1.RoleName.ADMIN },
    });
    await prisma.role.upsert({
        where: { name: client_1.RoleName.EVALUATOR },
        update: {},
        create: { name: client_1.RoleName.EVALUATOR },
    });
    const isProd = process.env.NODE_ENV === 'production';
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || (isProd ? '' : 'admin@demo.com');
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const adminFullName = process.env.ADMIN_FULL_NAME?.trim() || 'Administrador';
    if (!adminEmail)
        throw new Error('ADMIN_EMAIL is required to seed the admin user');
    const adminRole = await prisma.role.findUnique({
        where: { name: client_1.RoleName.ADMIN },
        select: { id: true },
    });
    if (!adminRole) {
        throw new Error('ADMIN role not found after upsert');
    }
    const existingAdminUser = await prisma.user.findUnique({
        where: { email: adminEmail },
        select: { id: true },
    });
    let passwordHashToSet = null;
    if (adminPassword) {
        if (adminPassword.length < 8) {
            throw new Error('ADMIN_PASSWORD must be at least 8 characters');
        }
        passwordHashToSet = await bcrypt.hash(adminPassword, 12);
    }
    else if (!existingAdminUser) {
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
//# sourceMappingURL=seed.js.map