import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../api/src/common/prisma/prisma.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private prisma: PrismaService,
        @InjectQueue('gsc-sync') private gscSyncQueue: Queue,
        @InjectQueue('page-analysis') private pageAnalysisQueue: Queue,
        @InjectQueue('alerts') private alertsQueue: Queue,
    ) { }

    /**
     * Daily GSC sync at 2 AM
     * Syncs all active audit projects with Google Search Console
     */
    @Cron('0 2 * * *', {
        name: 'daily-gsc-sync',
        timeZone: 'UTC',
    })
    async dailyGscSync() {
        this.logger.log('Starting daily GSC sync');

        const projects = await this.prisma.auditProject.findMany({
            include: {
                site: {
                    include: {
                        owner: true,
                    },
                },
            },
        });

        this.logger.log(`Found ${projects.length} projects to sync`);

        for (const project of projects) {
            try {
                await this.gscSyncQueue.add('import-pages', {
                    projectId: project.id,
                    userId: project.site.ownerId,
                });

                this.logger.log(`Queued GSC sync for project ${project.id}`);
            } catch (error) {
                this.logger.error(`Failed to queue GSC sync for project ${project.id}:`, error);
            }
        }

        this.logger.log('Daily GSC sync completed');
    }

    /**
     * Weekly re-analysis at 3 AM on Sundays
     * Re-scores pages that haven't been analyzed recently
     */
    @Cron('0 3 * * 0', {
        name: 'weekly-re-analysis',
        timeZone: 'UTC',
    })
    async weeklyReAnalysis() {
        this.logger.log('Starting weekly re-analysis');

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const pages = await this.prisma.auditPage.findMany({
            where: {
                OR: [
                    { lastAnalysedAt: null },
                    { lastAnalysedAt: { lt: sevenDaysAgo } },
                ],
            },
            take: 100, // Limit to avoid overwhelming the queue
            orderBy: {
                lastAnalysedAt: 'asc', // Oldest first
            },
        });

        this.logger.log(`Found ${pages.length} pages to re-analyze`);

        for (const page of pages) {
            try {
                await this.pageAnalysisQueue.add('score-page', {
                    pageId: page.id,
                });

                this.logger.log(`Queued re-analysis for page ${page.id}`);
            } catch (error) {
                this.logger.error(`Failed to queue re-analysis for page ${page.id}:`, error);
            }
        }

        this.logger.log('Weekly re-analysis completed');
    }

    /**
     * Alert evaluation every 6 hours
     * Checks for significant metric changes
     */
    @Cron('0 */6 * * *', {
        name: 'alert-evaluation',
        timeZone: 'UTC',
    })
    async evaluateAlerts() {
        this.logger.log('Starting alert evaluation');

        const projects = await this.prisma.auditProject.findMany();

        this.logger.log(`Found ${projects.length} projects to evaluate`);

        for (const project of projects) {
            try {
                await this.alertsQueue.add('evaluate-project-changes', {
                    projectId: project.id,
                });

                this.logger.log(`Queued alert evaluation for project ${project.id}`);
            } catch (error) {
                this.logger.error(
                    `Failed to queue alert evaluation for project ${project.id}:`,
                    error,
                );
            }
        }

        this.logger.log('Alert evaluation completed');
    }

    /**
     * Manual trigger for immediate sync
     * Can be called programmatically
     */
    async triggerImmediateSync(projectId: string, userId: string) {
        this.logger.log(`Triggering immediate sync for project ${projectId}`);

        await this.gscSyncQueue.add('import-pages', {
            projectId,
            userId,
        });
    }

    /**
     * Manual trigger for page re-analysis
     * Can be called programmatically
     */
    async triggerPageReAnalysis(pageId: string) {
        this.logger.log(`Triggering re-analysis for page ${pageId}`);

        await this.pageAnalysisQueue.add('score-page', {
            pageId,
        });
    }
}
