import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SitesService } from '../sites/sites.service';
import { GscService } from '../gsc/gsc.service';
import { CreateAuditProjectDto } from './dto/create-audit-project.dto';
import { AuditProject } from '@prisma/client';
import { CrawlerService } from '../crawler/crawler.service';
import { SerpAnalysisService } from '../integrations/serp/serp-analysis.service';

@Injectable()
export class ContentAuditService {
    constructor(
        private prisma: PrismaService,
        private sitesService: SitesService,
        private gscService: GscService,
        private crawlerService: CrawlerService,
        private serpAnalysisService: SerpAnalysisService,
        @InjectQueue('page-analysis') private pageAnalysisQueue: Queue,
    ) { }

    // ... (createAuditProject and importPagesFromGSC remain unchanged)

    async createAuditProject(
        userId: string,
        siteId: string,
        dto: CreateAuditProjectDto,
    ): Promise<AuditProject> {
        // Verify site ownership
        await this.sitesService.findOne(userId, siteId);

        // Check if project already exists for this site
        const existing = await this.prisma.auditProject.findUnique({
            where: { siteId },
        });

        if (existing) {
            throw new BadRequestException('Audit project already exists for this site');
        }

        // Create project
        const project = await this.prisma.auditProject.create({
            data: {
                siteId,
                gscProperty: dto.gscProperty,
                primaryCountry: dto.targetCountry || 'us',
                maxPages: dto.maxPages || 100,
                excludedPaths: dto.excludedPaths || [],
            },
        });

        // Trigger initial import
        await this.importPagesFromGSC(userId, project.id);

        return project;
    }

    async importPagesFromGSC(userId: string, projectId: string) {
        const result = await this.gscService.importPagesToProject(userId, projectId);
        return result;
    }

    async refreshPageAnalysis(userId: string, pageId: string) {
        const page = await this.prisma.auditPage.findUnique({
            where: { id: pageId },
            include: { project: true },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        // Verify ownership via project->site
        await this.sitesService.findOne(userId, page.project.siteId);

        // Fetch content using CrawlerService
        try {
            const crawled = await this.crawlerService.fetchPageContent(page.url);
            await this.prisma.auditPage.update({
                where: { id: pageId },
                data: {
                    title: crawled.title,
                    metaDescription: crawled.metaDescription,
                    content: crawled.content,
                },
            });
        } catch (error) {
            console.error(`Failed to crawl page ${page.url}:`, error);
            // Continue even if crawling fails
        }

        // We just queue the analysis job. The processor will fetch the content.
        await this.pageAnalysisQueue.add('score-page', {
            pageId,
        });

        return { message: 'Content fetched and analysis job enqueued' };
    }

    async updatePageContent(userId: string, pageId: string, content: string) {
        const page = await this.prisma.auditPage.findUnique({
            where: { id: pageId },
            include: { project: true },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        // Verify ownership
        await this.sitesService.findOne(userId, page.project.siteId);

        const updated = await this.prisma.auditPage.update({
            where: { id: pageId },
            data: { content },
        });

        return updated;
    }

    async getPage(userId: string, pageId: string) {
        const page = await this.prisma.auditPage.findUnique({
            where: { id: pageId },
            include: {
                project: {
                    include: {
                        site: true
                    }
                }
            },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        // Verify ownership
        if (page.project.site.ownerId !== userId) {
            throw new NotFoundException('Page not found');
        }

        // Map to frontend format
        return {
            id: page.id,
            url: page.url,
            title: page.title,
            metaDescription: page.metaDescription,
            content: page.content,
            impressions: page.impressions30d,
            clicks: page.clicks30d,
            ctr: page.ctr30d,
            position: page.avgPosition,
            score: page.contentScore,
            project: {
                siteId: page.project.siteId,
                id: page.projectId,
            }
        };
    }

    async runSerpAnalysis(userId: string, pageId: string) {
        const page = await this.prisma.auditPage.findUnique({
            where: { id: pageId },
            include: { project: true },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        // Verify ownership
        await this.sitesService.findOne(userId, page.project.siteId);

        // Use mainKeyword or fallback to title/url
        const keyword = page.mainKeyword || page.title || page.url;

        // Run SERP analysis (this creates/updates ContentGuidelines)
        const guidelines = await this.serpAnalysisService.analyzeKeyword(
            pageId,
            keyword,
            'us',
            'en',
        );

        return {
            message: 'SERP analysis completed',
            guidelines,
        };
    }

    async getAuditProject(userId: string, siteId: string): Promise<AuditProject> {
        // Verify site ownership
        await this.sitesService.findOne(userId, siteId);

        const project = await this.prisma.auditProject.findUnique({
            where: { siteId },
        });

        if (!project) {
            throw new NotFoundException('Audit project not found');
        }

        return project;
    }

    async listPages(userId: string, siteId: string, filters: any) {
        // Verify site ownership and get project
        const project = await this.getAuditProject(userId, siteId);

        // Build where clause
        const where: any = {
            projectId: project.id,
        };

        // Search filter
        if (filters.search) {
            where.OR = [
                { url: { contains: filters.search, mode: 'insensitive' } },
                { title: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        // Content score filters
        if (filters.contentScoreMin !== undefined) {
            where.contentScore = { ...where.contentScore, gte: filters.contentScoreMin };
        }
        if (filters.contentScoreMax !== undefined) {
            where.contentScore = { ...where.contentScore, lte: filters.contentScoreMax };
        }

        // Position filters
        if (filters.positionMin !== undefined) {
            where.avgPosition = { ...where.avgPosition, gte: filters.positionMin };
        }
        if (filters.positionMax !== undefined) {
            where.avgPosition = { ...where.avgPosition, lte: filters.positionMax };
        }

        // Recommendation filter
        if (filters.recommendation) {
            where.recommendation = filters.recommendation;
        }

        // Pagination
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 20;
        const skip = (page - 1) * pageSize;

        // Sorting
        const sortBy = filters.sortBy || 'contentScore';
        const sortOrder = filters.sortOrder || 'desc';
        const orderBy = { [sortBy]: sortOrder };

        // Execute queries
        const [pages, total] = await Promise.all([
            this.prisma.auditPage.findMany({
                where,
                orderBy,
                skip,
                take: pageSize,
                select: {
                    id: true,
                    url: true,
                    title: true,
                    mainKeyword: true,
                    avgPosition: true,
                    clicks30d: true,
                    impressions30d: true,
                    ctr30d: true,
                    prevClicks30d: true,
                    prevImpressions30d: true,
                    prevCtr30d: true,
                    contentScore: true,
                    recommendation: true,
                    recommendationScore: true,
                    lastAnalysedAt: true,
                },
            }),
            this.prisma.auditPage.count({ where }),
        ]);

        // Calculate deltas for each page
        const pagesWithDeltas = pages.map((page) => ({
            id: page.id,
            url: page.url,
            title: page.title,
            mainKeyword: page.mainKeyword,
            avgPosition: page.avgPosition,
            clicks30d: page.clicks30d,
            impressions30d: page.impressions30d,
            ctr30d: page.ctr30d,
            clicksDelta: page.clicks30d && page.prevClicks30d
                ? page.clicks30d - page.prevClicks30d
                : undefined,
            impressionsDelta: page.impressions30d && page.prevImpressions30d
                ? page.impressions30d - page.prevImpressions30d
                : undefined,
            ctrDelta: page.ctr30d && page.prevCtr30d
                ? page.ctr30d - page.prevCtr30d
                : undefined,
            contentScore: page.contentScore,
            recommendation: page.recommendation,
            recommendationScore: page.recommendationScore,
            lastAnalysedAt: page.lastAnalysedAt,
        }));

        return {
            pages: pagesWithDeltas,
            total,
            page,
            pageSize,
        };
    }

}
