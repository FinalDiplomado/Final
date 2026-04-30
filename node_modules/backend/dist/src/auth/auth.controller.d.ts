import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: number;
            role: {
                name: import("@prisma/client").$Enums.RoleName;
            };
            email: string;
            fullName: string;
        };
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: number;
            email: string;
            fullName: string;
            role: {
                name: import("@prisma/client").$Enums.RoleName;
            };
        };
        accessToken: string;
    }>;
}
