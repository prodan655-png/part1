import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokens } from '../../common/shared';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto): Promise<AuthTokens> {
        // Check if user already exists
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.usersService.create({
            email: dto.email,
            password: hashedPassword,
        });

        // Generate tokens
        return this.generateTokens(user.id, user.email);
    }

    async login(dto: LoginDto): Promise<AuthTokens> {
        // Find user
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate tokens
        return this.generateTokens(user.id, user.email);
    }

    async validateUser(userId: string) {
        return this.usersService.findById(userId);
    }

    private generateTokens(userId: string, email: string): AuthTokens {
        const payload = { sub: userId, email };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}
