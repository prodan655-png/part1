import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, searchconsole_v1, Auth } from 'googleapis';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GSCConnection } from '@prisma/client';

@Injectable()
export class GscService {
    private oauth2Client!: Auth.OAuth2Client;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.oauth2Client = new google.auth.OAuth2(
            this.configService.get<string>('GSC_CLIENT_ID'),
            this.configService.get<string>('GSC_CLIENT_SECRET'),
            this.configService.get<string>('GSC_REDIRECT_URI'),
        );
    }

    getAuthUrl(): string {
        const scopes = [
            'https://www.googleapis.com/auth/webmasters.readonly',
            'https://www.googleapis.com/auth/userinfo.email', // to identify the connected account
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // crucial for getting refresh token
            scope: scopes,
            prompt: 'consent', // force consent to ensure refresh token is returned
        });
    }

    async linkAccount(userId: string, code: string): Promise<GSCConnection> {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);

            if (!tokens.access_token || !tokens.expiry_date) {
                throw new BadRequestException('Failed to retrieve valid tokens from Google');
            }

            // Get user info to identify the connection
            this.oauth2Client.setCredentials(tokens);
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            // Log email for debugging
            console.log(`Linked GSC account: ${userInfo.data.email}`);

            // Check if connection already exists for this user
            const existing = await this.prisma.gSCConnection.findFirst({
                where: { userId },
            });

            if (existing) {
                // Update existing connection
                return this.prisma.gSCConnection.update({
                    where: { id: existing.id },
                    data: {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token || existing.refreshToken, // Keep old refresh token if new one not provided
                        expiry: new Date(tokens.expiry_date),
                        updatedAt: new Date(),
                    },
                });
            }

            if (!tokens.refresh_token) {
                throw new BadRequestException(
                    'No refresh token received. Please revoke access and try again to grant offline access.',
                );
            }

            // Create new connection
            return this.prisma.gSCConnection.create({
                data: {
                    userId,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiry: new Date(tokens.expiry_date),
                    provider: 'google_search_console',
                },
            });
        } catch (error) {
            console.error('GSC Link Error:', error);
            throw new BadRequestException('Failed to link Google Search Console account');
        }
    }

    async getConnection(userId: string): Promise<GSCConnection> {
        const connection = await this.prisma.gSCConnection.findFirst({
            where: { userId },
        });

        if (!connection) {
            throw new NotFoundException('GSC connection not found');
        }

        return connection;
    }

    async getClient(userId: string): Promise<searchconsole_v1.Searchconsole> {
        const connection = await this.getConnection(userId);

        // Check if token needs refresh
        const now = new Date();
        // Refresh if expired or expiring in less than 5 minutes
        if (connection.expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
            await this.refreshTokens(connection);
        } else {
            this.oauth2Client.setCredentials({
                access_token: connection.accessToken,
                refresh_token: connection.refreshToken,
            });
        }

        return google.searchconsole({ version: 'v1', auth: this.oauth2Client });
    }

    private async refreshTokens(connection: GSCConnection) {
        this.oauth2Client.setCredentials({
            refresh_token: connection.refreshToken,
        });

        try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();

            if (!credentials.access_token || !credentials.expiry_date) {
                throw new Error('Failed to refresh access token');
            }

            // Update DB
            await this.prisma.gSCConnection.update({
                where: { id: connection.id },
                data: {
                    accessToken: credentials.access_token,
                    expiry: new Date(credentials.expiry_date),
                    // Refresh token might be rotated, update if present
                    refreshToken: credentials.refresh_token || connection.refreshToken,
                },
            });

            // Update client instance
            this.oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error('Token Refresh Error:', error);
            throw new BadRequestException('Failed to refresh GSC tokens. Please reconnect.');
        }
    }

    async listSites(userId: string) {
        const client = await this.getClient(userId);
        try {
            const res = await client.sites.list();
            return res.data.siteEntry || [];
        } catch (error) {
            console.error('GSC List Sites Error:', error);
            throw new BadRequestException('Failed to fetch sites from GSC');
        }
    }

    async fetchTopPages(
        userId: string,
        siteUrl: string,
        startDate: string,
        endDate: string,
        limit = 100,
    ) {
        const client = await this.getClient(userId);
        try {
            const res = await client.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['page'],
                    rowLimit: limit,
                    aggregationType: 'byPage',
                },
            });

            return res.data.rows || [];
        } catch (error) {
            console.error('GSC Fetch Top Pages Error:', error);
            throw new BadRequestException('Failed to fetch top pages from GSC');
        }
    }

    async fetchPageAnalytics(
        userId: string,
        siteUrl: string,
        pageUrl: string,
        startDate: string,
        endDate: string,
    ) {
        const client = await this.getClient(userId);
        try {
            const res = await client.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['query'],
                    dimensionFilterGroups: [
                        {
                            filters: [
                                {
                                    dimension: 'page',
                                    operator: 'equals',
                                    expression: pageUrl,
                                },
                            ],
                        },
                    ],
                    rowLimit: 50, // Top 50 queries for the page
                },
            });

            return res.data.rows || [];
        } catch (error) {
            console.error('GSC Fetch Page Analytics Error:', error);
            throw new BadRequestException('Failed to fetch page analytics from GSC');
        }
    }
}
