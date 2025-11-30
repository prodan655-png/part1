import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '../../../api/src/common/prisma/prisma.service';
import { ContentScoringService } from '../../../api/src/modules/content-audit/services/content-scoring.service';
import { NlpService } from '../../../api/src/modules/nlp/nlp.service';
import { HtmlScraperService } from '../../../api/src/modules/integrations/serp/html-scraper.service';

@Processor('page-analysis')
export class PageAnalysisProcessor extends WorkerHost {
    private readonly logger = new Logger(PageAnalysisProcessor.name);

    constructor(
        private prisma: PrismaService,
        private scoringService: ContentScoringService,
        // NlpService is used internally by ScoringService, but we might need it directly later
        private nlpService: NlpService,
        private htmlScraper: HtmlScraperService,
        @InjectQueue('serp-analysis') private serpAnalysisQueue: Queue,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case 'score-page':
                return this.handleScorePage(job.data);
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }

    private async handleScorePage(data: { pageId: string; pageText?: string }) {
        const { pageId } = data;
        let { pageText } = data;

        const page = await this.prisma.auditPage.findUnique({
            where: { id: pageId },
            include: { guidelines: true, project: true },
        });

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        // Fetch content if not provided
        if (!pageText) {
            this.logger.log(`Fetching content for page ${pageId} (${page.url})`);
            const scraped = await this.htmlScraper.scrape(page.url);
            if (scraped) {
                pageText = scraped.bodyText;
                // Optionally update page title/meta if changed
            } else {
                this.logger.warn(`Failed to scrape content for page ${pageId}`);
                // If we can't scrape, we can't score properly.
                // But maybe we should fail? Or retry?
                // For now, let's throw to retry
                throw new Error(`Failed to scrape content for page ${pageId}`);
            }
        }

        if (!page.guidelines) {
            this.logger.warn(`No guidelines found for page ${pageId}. Triggering SERP analysis.`);

            // Trigger SERP analysis
            // Use main keyword or fall back to title or url
            const keyword = page.mainKeyword || page.title || 'seo';

            await this.serpAnalysisQueue.add('analyze-keyword', {
                auditPageId: pageId,
                keyword,
                country: page.project.primaryCountry,
                language: 'en', // Should be from project or detected
            });

            return { status: 'deferred', reason: 'waiting_for_guidelines' };
        }

        // Calculate score
        const result = this.scoringService.calculateScore(
            pageText,
            page.guidelines,
            page.guidelines.languageCode,
        );

        // Update page with score
        await this.prisma.auditPage.update({
            where: { id: pageId },
            data: {
                contentScore: result.contentScore,
                recommendation: result.recommendation,
                recommendationScore: result.recommendationScore,
                lastAnalysedAt: new Date(),
            },
        });

        this.logger.log(`Scored page ${pageId}: ${result.contentScore}`);
        return result;
    }
}
