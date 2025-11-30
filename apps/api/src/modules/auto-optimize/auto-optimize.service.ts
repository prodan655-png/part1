import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { NlpService } from '../nlp/nlp.service';
import { HtmlScraperService } from '../integrations/serp/html-scraper.service';
import {
    AutoOptimizePromptInput,
    ImportantTerm,
    ChangeStatus,
} from '../../common/shared';

@Injectable()
export class AutoOptimizeService {
    private readonly logger = new Logger(AutoOptimizeService.name);

    constructor(
        private prisma: PrismaService,
        private geminiService: GeminiService,
        private nlpService: NlpService,
        private htmlScraper: HtmlScraperService,
    ) { }

    async generateSuggestions(userId: string, pageId: string) {
        this.logger.log(`Generating auto-optimize suggestions for page ${pageId}`);

        // Fetch page with guidelines
        const page = await this.prisma.auditPage.findUnique({
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

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        // Verify ownership
        if (page.project.site.ownerId !== userId) {
            throw new NotFoundException('Page not found');
        }

        if (!page.guidelines) {
            throw new BadRequestException(
                'No content guidelines available for this page. Run SERP analysis first.',
            );
        }

        // Scrape current page content
        this.logger.log(`Scraping content from ${page.url}`);
        const scraped = await this.htmlScraper.scrape(page.url);
        if (!scraped?.bodyText) {
            throw new BadRequestException('Failed to fetch page content');
        }

        const pageText = scraped.bodyText;

        // Analyze current content with NLP
        const nlpAnalysis = this.nlpService.analyzeText(
            pageText,
            page.guidelines.languageCode,
        );

        // Parse important terms from guidelines
        const importantTerms = (page.guidelines.importantTerms as any[]) || [];

        // Identify missing and underused terms
        const extractedKeywords = this.nlpService.extractKeywords(
            pageText,
            100, // Get top 100 keywords to check against guidelines
            page.guidelines.languageCode,
        );

        // Convert to map for O(1) lookup
        const termCounts: Record<string, number> = {};
        extractedKeywords.forEach(k => {
            termCounts[k.term] = k.count;
        });
        const missingTerms: ImportantTerm[] = [];
        const underUsedTerms: ImportantTerm[] = [];

        for (const term of importantTerms) {
            const currentCount = termCounts[term.termNormalized] || 0;

            if (currentCount === 0 && term.importance > 0.6) {
                // Missing important term
                missingTerms.push(term);
            } else if (currentCount < term.avgCount * 0.5 && term.importance > 0.5) {
                // Underused term (less than 50% of average)
                underUsedTerms.push({
                    ...term,
                    currentCount,
                });
            }
        }

        this.logger.log(
            `Analysis: ${missingTerms.length} missing terms, ${underUsedTerms.length} underused terms`,
        );

        // Prepare AI prompt input
        const promptInput: AutoOptimizePromptInput = {
            pageText,
            keyword: page.guidelines.keyword,
            languageCode: page.guidelines.languageCode,
            missingTerms: missingTerms.slice(0, 5), // Top 5
            underUsedTerms: underUsedTerms.slice(0, 5), // Top 5
            guidelines: {
                recommendedWordCount: page.guidelines.avgWords
                    ? {
                        min: Math.floor(page.guidelines.minWords || page.guidelines.avgWords * 0.8),
                        max: Math.floor(page.guidelines.maxWords || page.guidelines.avgWords * 1.2),
                    }
                    : undefined,
                currentWordCount: nlpAnalysis.wordCount,
            },
        };

        // Generate AI suggestions
        const changeDrafts = await this.geminiService.generateAutoOptimizeSuggestions(
            promptInput,
        );

        // Idempotent: Delete old suggested changes for this page before creating new ones
        // This prevents accumulation of outdated suggestions
        await this.prisma.autoOptimizeChange.deleteMany({
            where: {
                auditPageId: pageId,
                status: ChangeStatus.SUGGESTED,
            },
        });

        this.logger.log('Cleared old suggested changes (idempotent operation)');

        // Save suggestions to database
        const changes = await Promise.all(
            changeDrafts.map((draft) =>
                this.prisma.autoOptimizeChange.create({
                    data: {
                        auditPageId: pageId,
                        changeType: draft.changeType,
                        location: draft.location, // Already JSON string
                        originalText: draft.originalText,
                        suggestedText: draft.suggestedText,
                        status: ChangeStatus.SUGGESTED,
                    },
                }),
            ),
        );

        this.logger.log(`Created ${changes.length} auto-optimize suggestions`);

        return {
            changes,
            total: changes.length,
        };
    }

    async applySuggestion(userId: string, changeId: string) {
        const change = await this.findChangeWithOwnershipCheck(userId, changeId);

        if (change.status !== ChangeStatus.SUGGESTED) {
            throw new BadRequestException(
                `Change is already ${change.status}. Only suggested changes can be applied.`,
            );
        }

        const updated = await this.prisma.autoOptimizeChange.update({
            where: { id: changeId },
            data: { status: ChangeStatus.APPLIED },
        });

        this.logger.log(`Applied suggestion ${changeId}`);
        return updated;
    }

    async rejectSuggestion(userId: string, changeId: string) {
        const change = await this.findChangeWithOwnershipCheck(userId, changeId);

        if (change.status !== ChangeStatus.SUGGESTED) {
            throw new BadRequestException(
                `Change is already ${change.status}. Only suggested changes can be rejected.`,
            );
        }

        const updated = await this.prisma.autoOptimizeChange.update({
            where: { id: changeId },
            data: { status: ChangeStatus.REJECTED },
        });

        this.logger.log(`Rejected suggestion ${changeId}`);
        return updated;
    }

    async listChanges(userId: string, pageId: string, status?: ChangeStatus) {
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

        const changes = await this.prisma.autoOptimizeChange.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return {
            changes,
            total: changes.length,
        };
    }

    private async findChangeWithOwnershipCheck(userId: string, changeId: string) {
        const change = await this.prisma.autoOptimizeChange.findUnique({
            where: { id: changeId },
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

        if (!change || change.auditPage.project.site.ownerId !== userId) {
            throw new NotFoundException('Change not found');
        }

        return change;
    }
}
