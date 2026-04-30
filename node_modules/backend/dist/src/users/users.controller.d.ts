import { Request } from 'express';
import { JwtUser } from '../auth/jwt.strategy';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    me(req: Request & {
        user?: JwtUser;
    }): Promise<{
        id: number;
        role: {
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        fullName: string;
    }>;
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
    updateRole(req: Request & {
        user?: JwtUser;
    }, id: number, dto: UpdateUserRoleDto): Promise<{
        id: number;
        role: {
            name: import("@prisma/client").$Enums.RoleName;
        };
        email: string;
        fullName: string;
    }>;
}
