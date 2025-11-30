import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { SerpAnalysisService } from '../../../api/src/modules/integrations/serp/serp-analysis.service';
import { PrismaService } from '../../../api/src/common/prisma/prisma.service';

@Processor('serp-analysis')
export class SerpAnalysisProcessor extends WorkerHost {
    private readonly logger = new Logger(SerpAnalysisProcessor.name);

    constructor(
        private serpAnalysisService: SerpAnalysisService,
        private prisma: PrismaService,
        @InjectQueue('page-analysis') private pageAnalysisQueue: Queue,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case 'analyze-keyword':
                return this.handleAnalyzeKeyword(job.data);
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }

    private async handleAnalyzeKeyword(data: {
        auditPageId: string;
        keyword: string;
        country: string;
        language: string;
    }) {
        const { auditPageId, keyword, country, language } = data;

        this.logger.log(`Starting SERP analysis for page ${auditPageId} (${keyword})`);

        // 1. Run analysis (fetches SERP, scrapes, generates guidelines)
        const guidelines = await this.serpAnalysisService.analyzeKeyword(
            auditPageId,
            keyword,
            country,
            language,
        );

        this.logger.log(`Guidelines generated for page ${auditPageId}`);

        // 2. Trigger scoring for the page now that guidelines exist
        // The PageAnalysisProcessor will fetch the content if not provided.

        await this.pageAnalysisQueue.add('score-page', {
            pageId: auditPageId,
        });

        this.logger.log(`Triggered scoring for page ${auditPageId}`);

        return { success: true, guidelinesId: guidelines.id };
    }
}
