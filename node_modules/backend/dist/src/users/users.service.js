"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async getById(id) {
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
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return user;
    }
    async updateRole(actor, userId, roleName) {
        const role = await this.prisma.role.findUnique({
            where: { name: roleName },
            select: { id: true, name: true },
        });
        if (!role) {
            throw new common_1.BadRequestException('Rol inválido');
        }
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: { select: { name: true } } },
        });
        if (!existing)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const isDemotingAdmin = existing.role.name === client_1.RoleName.ADMIN && role.name !== client_1.RoleName.ADMIN;
        if (isDemotingAdmin) {
            const adminsCount = await this.prisma.user.count({
                where: { role: { name: client_1.RoleName.ADMIN } },
            });
            if (adminsCount <= 1) {
                throw new common_1.BadRequestException('No se puede quitar el rol ADMIN al único administrador del sistema');
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map