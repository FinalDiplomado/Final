import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../auth/jwt.strategy';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listAll(): Promise<{
        id: number;
        role: {
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        fullName: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getById(id: number): Promise<{
        id: number;
        role: {
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        fullName: string;
    }>;
    updateRole(actor: JwtUser, userId: number, roleName: RoleName): Promise<{
        id: number;
        role: {
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        fullName: string;
    }>;
}
