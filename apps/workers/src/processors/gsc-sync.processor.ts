import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { GscService } from '../../../api/src/modules/integrations/gsc/gsc.service';
import { PrismaService } from '../../../api/src/common/prisma/prisma.service';

@Processor('gsc-sync')
export class GscSyncProcessor extends WorkerHost {
    private readonly logger = new Logger(GscSyncProcessor.name);

    constructor(
        private gscService: GscService,
        private prisma: PrismaService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case 'import-pages':
                return this.handleImportPages(job.data);
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }

    private async handleImportPages(data: { projectId: string; userId: string }) {
        const { projectId, userId } = data;

        const project = await this.prisma.auditProject.findUnique({
            where: { id: projectId },
            include: { site: true },
        });

        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }

        // Calculate date range (last 30 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

        this.logger.log(`Fetching top pages for ${project.site.domain} from ${startDate} to ${endDate}`);

        const pages = await this.gscService.fetchTopPages(
            userId,
            project.gscProperty,
            startDate,
            endDate,
            project.maxPages,
        );

        this.logger.log(`Found ${pages.length} pages. Saving to database...`);

        for (const page of pages) {
            if (!page.keys || !page.keys[0]) continue;

            const url = page.keys[0];
            const metrics = {
                clicks: page.clicks || 0,
                impressions: page.impressions || 0,
                ctr: page.ctr || 0,
                position: page.position || 0,
            };

            await this.prisma.auditPage.upsert({
                where: {
                    projectId_url: {
                        projectId,
                        url,
                    },
                },
                create: {
                    projectId,
                    url,
                    clicks30d: metrics.clicks,
                    impressions30d: metrics.impressions,
                    ctr30d: metrics.ctr,
                    avgPosition: metrics.position,
                    lastAnalysedAt: new Date(),
                },
                update: {
                    clicks30d: metrics.clicks,
                    impressions30d: metrics.impressions,
                    ctr30d: metrics.ctr,
                    avgPosition: metrics.position,
                    lastAnalysedAt: new Date(),
                },
            });
        }

        this.logger.log(`Import completed for project ${projectId}`);
        return { imported: pages.length };
    }
}
