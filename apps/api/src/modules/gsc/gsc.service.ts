import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GscOAuthService } from './gsc-oauth.service';

interface GSCPage {
    url: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
}

@Injectable()
export class GscService {
    constructor(
        private prisma: PrismaService,
        private gscOAuth: GscOAuthService,
    ) { }

    async fetchPagesFromGSC(
        userId: string,
        property: string,
        maxPages: number = 100,
    ): Promise<GSCPage[]> {
        const accessToken = await this.gscOAuth.getValidAccessToken(userId);

        // Set OAuth2 credentials
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: accessToken,
        });

        const searchconsole = google.searchconsole({
            version: 'v1',
            auth: oauth2Client, // Use OAuth2 client instead of just token
        });

        // Get data for the last 28 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 28);

        const response = await searchconsole.searchanalytics.query({
            siteUrl: property,
            requestBody: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                dimensions: ['page'],
                rowLimit: maxPages,
                dataState: 'final',
            },
        });

        const rows = response.data.rows || [];

        return rows.map((row: any) => ({
            url: row.keys[0],
            impressions: Math.round(row.impressions || 0),
            clicks: Math.round(row.clicks || 0),
            ctr: row.ctr || 0,
            position: row.position || 0,
        }));
    }

    async importPagesToProject(
        userId: string,
        auditProjectId: string,
    ): Promise<{ imported: number; updated: number }> {
        // Get audit project with site
        const project = await this.prisma.auditProject.findUnique({
            where: { id: auditProjectId },
            include: { site: true },
        });

        if (!project) {
            throw new Error('Audit project not found');
        }

        // Verify ownership
        if (project.site.ownerId !== userId) {
            throw new Error('Unauthorized');
        }

        // Fetch pages from GSC
        const gscPages = await this.fetchPagesFromGSC(
            userId,
            project.gscProperty,
            project.maxPages || 100,
        );

        let imported = 0;
        let updated = 0;

        // Import or update each page
        for (const gscPage of gscPages) {
            const existing = await this.prisma.auditPage.findFirst({
                where: {
                    projectId: project.id,
                    url: gscPage.url,
                },
            });

            if (existing) {
                // Update existing page
                await this.prisma.auditPage.update({
                    where: { id: existing.id },
                    data: {
                        impressions30d: gscPage.impressions,
                        clicks30d: gscPage.clicks,
                        ctr30d: gscPage.ctr,
                        avgPosition: gscPage.position,
                    },
                });
                updated++;
            } else {
                // Create new page
                await this.prisma.auditPage.create({
                    data: {
                        projectId: project.id,
                        url: gscPage.url,
                        impressions30d: gscPage.impressions,
                        clicks30d: gscPage.clicks,
                        ctr30d: gscPage.ctr,
                        avgPosition: gscPage.position,
                    },
                });
                imported++;
            }
        }

        return { imported, updated };
    }
}
