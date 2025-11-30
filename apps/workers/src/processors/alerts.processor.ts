import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../api/src/common/prisma/prisma.service';

interface EvaluatePageChangesData {
    auditPageId?: string; // Optional: evaluate specific page
    projectId?: string;   // Optional: evaluate all pages in project
}

@Processor('alerts')
export class AlertsProcessor extends WorkerHost {
    private readonly logger = new Logger(AlertsProcessor.name);

    constructor(private prisma: PrismaService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case 'evaluate-page-changes':
                return this.handleEvaluatePageChanges(job.data);
            case 'evaluate-project-changes':
                return this.handleEvaluateProjectChanges(job.data);
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }

    private async handleEvaluatePageChanges(data: EvaluatePageChangesData) {
        const { auditPageId } = data;

        if (!auditPageId) {
            throw new Error('auditPageId is required');
        }

        const page = await this.prisma.auditPage.findUnique({
            where: { id: auditPageId },
        });

        if (!page) {
            throw new Error(`Page not found: ${auditPageId}`);
        }

        const alerts = await this.evaluatePage(page);
        this.logger.log(`Evaluated page ${auditPageId}: ${alerts.length} alerts created`);

        return { alerts: alerts.length };
    }

    private async handleEvaluateProjectChanges(data: EvaluatePageChangesData) {
        const { projectId } = data;

        if (!projectId) {
            throw new Error('projectId is required');
        }

        const pages = await this.prisma.auditPage.findMany({
            where: { projectId },
        });

        this.logger.log(`Evaluating ${pages.length} pages for project ${projectId}`);

        let totalAlerts = 0;
        for (const page of pages) {
            const alerts = await this.evaluatePage(page);
            totalAlerts += alerts.length;
        }

        this.logger.log(`Evaluated project ${projectId}: ${totalAlerts} alerts created`);
        return { pagesEvaluated: pages.length, alerts: totalAlerts };
    }

    private async evaluatePage(page: any) {
        const alerts: any[] = [];

        // Check for clicks drop/rise
        if (page.clicks30d !== null && page.prevClicks30d !== null) {
            const clicksChange = this.calculatePercentageChange(
                page.prevClicks30d,
                page.clicks30d,
            );

            if (clicksChange <= -30) {
                alerts.push({
                    auditPageId: page.id,
                    type: 'drop',
                    message: `Clicks dropped by ${Math.abs(clicksChange).toFixed(1)}% (${page.prevClicks30d} → ${page.clicks30d})`,
                });
            } else if (clicksChange >= 50) {
                alerts.push({
                    auditPageId: page.id,
                    type: 'rise',
                    message: `Clicks increased by ${clicksChange.toFixed(1)}% (${page.prevClicks30d} → ${page.clicks30d})`,
                });
            }
        }

        // Check for impressions drop/rise
        if (page.impressions30d !== null && page.prevImpressions30d !== null) {
            const impressionsChange = this.calculatePercentageChange(
                page.prevImpressions30d,
                page.impressions30d,
            );

            if (impressionsChange <= -30) {
                alerts.push({
                    auditPageId: page.id,
                    type: 'drop',
                    message: `Impressions dropped by ${Math.abs(impressionsChange).toFixed(1)}% (${page.prevImpressions30d} → ${page.impressions30d})`,
                });
            } else if (impressionsChange >= 50) {
                alerts.push({
                    auditPageId: page.id,
                    type: 'rise',
                    message: `Impressions increased by ${impressionsChange.toFixed(1)}% (${page.prevImpressions30d} → ${page.impressions30d})`,
                });
            }
        }

        // Check for position changes (positions are inverted - lower is better)
        if (page.avgPosition !== null && page.avgPosition > 0) {
            // Significant position improvement (drop in number = improvement)
            // No previous position data available in schema, so skip for now
            // Could be added by tracking historical data via PageMetricsSnapshot
        }

        // Create alerts in database
        for (const alertData of alerts) {
            await this.prisma.alert.create({
                data: alertData,
            });
        }

        return alerts;
    }

    private calculatePercentageChange(oldValue: number, newValue: number): number {
        if (oldValue === 0) {
            return newValue > 0 ? 100 : 0;
        }
        return ((newValue - oldValue) / oldValue) * 100;
    }
}
