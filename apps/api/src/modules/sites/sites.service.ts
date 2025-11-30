import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { Site } from '@prisma/client';

@Injectable()
export class SitesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateSiteDto): Promise<Site> {
        // Check if domain already exists
        const existing = await this.prisma.site.findUnique({
            where: { domain: dto.domain },
        });

        if (existing) {
            throw new ConflictException('Site with this domain already exists');
        }

        return this.prisma.site.create({
            data: {
                ...dto,
                ownerId: userId,
            },
        });
    }

    async findAll(userId: string): Promise<Site[]> {
        return this.prisma.site.findMany({
            where: { ownerId: userId },
            include: {
                auditProject: {
                    select: {
                        id: true,
                        _count: {
                            select: { pages: true },
                        },
                    },
                },
            },
        });
    }

    async findOne(userId: string, siteId: string): Promise<Site> {
        const site = await this.prisma.site.findUnique({
            where: { id: siteId },
            include: {
                auditProject: {
                    include: {
                        _count: {
                            select: { pages: true },
                        },
                    },
                },
            },
        });

        if (!site) {
            throw new NotFoundException('Site not found');
        }

        // Ensure user owns this site
        if (site.ownerId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return site;
    }

    async update(
        userId: string,
        siteId: string,
        dto: UpdateSiteDto,
    ): Promise<Site> {
        // Verify ownership
        await this.findOne(userId, siteId);

        return this.prisma.site.update({
            where: { id: siteId },
            data: dto,
        });
    }

    async delete(userId: string, siteId: string): Promise<void> {
        // Verify ownership
        await this.findOne(userId, siteId);

        await this.prisma.site.delete({
            where: { id: siteId },
        });
    }
}
