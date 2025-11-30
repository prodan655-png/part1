import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(data: { email: string; password: string }): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findAll(): Promise<Omit<User, 'password'>[]> {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                password: false, // Never expose passwords
            },
        });
    }

    async delete(id: string): Promise<void> {
        await this.findById(id); // Ensure exists
        await this.prisma.user.delete({
            where: { id },
        });
    }
}
