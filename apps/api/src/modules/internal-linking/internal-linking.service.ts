import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ImportantTerm } from '../../common/shared';

@Injectable()
export class InternalLinkingService {
    private readonly logger = new Logger(InternalLinkingService.name);
    private readonly RELEVANCE_THRESHOLD = 60;
    private readonly MAX_SUGGESTIONS = 10;

    constructor(private prisma: PrismaService) { }

    async generateSuggestions(userId: string, pageId: string, mode: string = 'basic') {
        this.logger.log(`Generating link suggestions for page ${pageId} (mode: ${mode})`);

        // Semantic mode not yet implemented
        if (mode === 'semantic') {
            throw new BadRequestException(
                'Semantic mode not yet implemented. Use mode="basic" for keyword-based suggestions.',
            );
        }

        // Fetch source page with project and guidelines
        const sourcePage = await this.prisma.auditPage.findUnique({
            where: { id: pageId },
            include: {
                guidelines: true,
                project: {
                    include: {
                        site: true,
                    },
                },
            },
        });

        if (!sourcePage) {
            throw new NotFoundException('Page not found');
        }

        // Verify ownership
        if (sourcePage.project.site.ownerId !== userId) {
            throw new NotFoundException('Page not found');
        }

        if (!sourcePage.guidelines) {
            throw new BadRequestException(
                'No content guidelines available. Run SERP analysis first.',
            );
        }

        // Fetch all other pages in the same project (potential targets)
        const targetPages = await this.prisma.auditPage.findMany({
            where: {
                projectId: sourcePage.projectId,
                id: { not: pageId }, // Exclude source page
            },
            include: {
                guidelines: true,
            },
        });

        this.logger.log(`Found ${targetPages.length} potential target pages`);

        if (targetPages.length === 0) {
            return { suggestions: [], total: 0 };
        }

        // Calculate relevance for each target page
        const scored = targetPages
            .filter((target) => target.guidelines) // Only pages with guidelines
            .map((target) => ({
                target,
                score: this.calculateRelevanceScore(sourcePage, target),
            }))
            .filter((item) => item.score >= this.RELEVANCE_THRESHOLD)
            .sort((a, b) => b.score - a.score)
            .slice(0, this.MAX_SUGGESTIONS);

        this.logger.log(
            `${scored.length} pages passed relevance threshold (${this.RELEVANCE_THRESHOLD})`,
        );

        // Idempotent: Delete old suggested links for this page
        await this.prisma.internalLinkSuggestion.deleteMany({
            where: {
                auditPageId: pageId,
                status: 'suggested',
            },
        });

        this.logger.log('Cleared old suggested links (idempotent operation)');

        // Create suggestions
        const suggestions = await Promise.all(
            scored.map((item) =>
                this.prisma.internalLinkSuggestion.create({
                    data: {
                        auditPageId: pageId,
                        sourceUrl: sourcePage.url,
                        targetUrl: item.target.url,
                        anchorText: this.generateAnchorText(item.target),
                        mode,
                        status: 'suggested',
                    },
                }),
            ),
        );

        this.logger.log(`Created ${suggestions.length} internal link suggestions`);

        return {
            suggestions,
            total: suggestions.length,
        };
    }

    async applySuggestion(userId: string, suggestionId: string) {
        const suggestion = await this.findSuggestionWithOwnershipCheck(
            userId,
            suggestionId,
        );

        if (suggestion.status !== 'suggested') {
            throw new BadRequestException(
                `Suggestion is already ${suggestion.status}. Only suggested links can be applied.`,
            );
        }

        const updated = await this.prisma.internalLinkSuggestion.update({
            where: { id: suggestionId },
            data: { status: 'applied' },
        });

        this.logger.log(`Applied link suggestion ${suggestionId}`);
        return updated;
    }

    async rejectSuggestion(userId: string, suggestionId: string) {
        const suggestion = await this.findSuggestionWithOwnershipCheck(
            userId,
            suggestionId,
        );

        if (suggestion.status !== 'suggested') {
            throw new BadRequestException(
                `Suggestion is already ${suggestion.status}. Only suggested links can be rejected.`,
            );
        }

        const updated = await this.prisma.internalLinkSuggestion.update({
            where: { id: suggestionId },
            data: { status: 'rejected' },
        });

        this.logger.log(`Rejected link suggestion ${suggestionId}`);
        return updated;
    }

    async listSuggestions(userId: string, pageId: string, status?: string) {
        // Verify page ownership
        const page = await this.prisma.auditPage.findUnique({
            where: { id: pageId },
            include: {
                project: {
                    include: { site: true },
                },
            },
        });

        if (!page || page.project.site.ownerId !== userId) {
            throw new NotFoundException('Page not found');
        }

        // Build query
        const where: any = { auditPageId: pageId };
        if (status) {
            where.status = status;
        }

        const suggestions = await this.prisma.internalLinkSuggestion.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return {
            suggestions,
            total: suggestions.length,
        };
    }

    // Private helper methods

    private calculateRelevanceScore(sourcePage: any, targetPage: any): number {
        let score = 0;

        // 1. Main keyword exact match (50 points)
        if (sourcePage.mainKeyword && targetPage.mainKeyword) {
            const sourceKeyword = sourcePage.mainKeyword.toLowerCase().trim();
            const targetKeyword = targetPage.mainKeyword.toLowerCase().trim();

            if (sourceKeyword === targetKeyword) {
                score += 50;
            } else if (
                sourceKeyword.includes(targetKeyword) ||
                targetKeyword.includes(sourceKeyword)
            ) {
                // Partial match
                score += 25;
            }
        }

        // 2. Important terms overlap (30 points max)
        const sourceTerms = this.extractTerms(sourcePage.guidelines);
        const targetTerms = this.extractTerms(targetPage.guidelines);

        if (sourceTerms.length > 0 && targetTerms.length > 0) {
            const overlapRatio = this.calculateOverlap(sourceTerms, targetTerms);
            score += overlapRatio * 30;
        }

        // 3. Same project bonus (20 points)
        // Already guaranteed by query, so always add
        score += 20;

        return Math.round(score);
    }

    private extractTerms(guidelines: any): string[] {
        if (!guidelines?.importantTerms) {
            return [];
        }

        const terms = guidelines.importantTerms as ImportantTerm[];
        return terms
            .filter((t) => t.importance > 0.6) // High importance only
            .map((t) => t.termNormalized.toLowerCase())
            .slice(0, 10); // Top 10 terms
    }

    private calculateOverlap(arr1: string[], arr2: string[]): number {
        if (arr1.length === 0 || arr2.length === 0) {
            return 0;
        }

        const set1 = new Set(arr1);
        const intersection = arr2.filter((x) => set1.has(x));
        return intersection.length / Math.max(arr1.length, arr2.length);
    }

    private generateAnchorText(targetPage: any): string {
        // Priority: mainKeyword > title > fallback
        if (targetPage.mainKeyword) {
            return targetPage.mainKeyword;
        }

        if (targetPage.title) {
            // Truncate long titles
            const title = targetPage.title;
            return title.length > 60 ? title.substring(0, 57) + '...' : title;
        }

        return 'related content';
    }

    private async findSuggestionWithOwnershipCheck(userId: string, suggestionId: string) {
        const suggestion = await this.prisma.internalLinkSuggestion.findUnique({
            where: { id: suggestionId },
            include: {
                auditPage: {
                    include: {
                        project: {
                            include: { site: true },
                        },
                    },
                },
            },
        });

        if (!suggestion || suggestion.auditPage.project.site.ownerId !== userId) {
            throw new NotFoundException('Suggestion not found');
        }

        return suggestion;
    }
}
