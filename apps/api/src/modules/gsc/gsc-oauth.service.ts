import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GscOAuthService {
    private oauth2Client;

    constructor(
        private config: ConfigService,
        private prisma: PrismaService,
    ) {
        this.oauth2Client = new google.auth.OAuth2(
            this.config.get('GOOGLE_CLIENT_ID'),
            this.config.get('GOOGLE_CLIENT_SECRET'),
            this.config.get('GOOGLE_CALLBACK_URL'),
        );
    }

    getAuthorizationUrl(userId: string): string {
        const scopes = [
            'https://www.googleapis.com/auth/webmasters.readonly',
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: userId, // Pass userId in state for callback
            prompt: 'consent', // Force consent screen to get refresh token
        });
    }

    async handleCallback(code: string, userId: string) {
        const { tokens } = await this.oauth2Client.getToken(code);

        if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
            throw new Error('Missing required tokens from Google OAuth');
        }

        // Save or update GSC connection
        const existing = await this.prisma.gSCConnection.findFirst({ where: { userId } });

        if (existing) {
            await this.prisma.gSCConnection.update({
                where: { id: existing.id },
                data: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiry: new Date(tokens.expiry_date),
                },
            });
        } else {
            await this.prisma.gSCConnection.create({
                data: {
                    userId,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiry: new Date(tokens.expiry_date),
                },
            });
        }

        return { success: true };
    }

    async getValidAccessToken(userId: string): Promise<string> {
        const connection = await this.prisma.gSCConnection.findFirst({
            where: { userId },
        });

        if (!connection) {
            throw new Error('No GSC connection found. Please connect your Google account.');
        }

        // Check if token is expired
        const now = new Date();
        if (connection.expiry > now) {
            return connection.accessToken;
        }

        // Refresh token
        this.oauth2Client.setCredentials({
            refresh_token: connection.refreshToken,
        });

        const { credentials } = await this.oauth2Client.refreshAccessToken();

        if (!credentials.access_token || !credentials.expiry_date) {
            throw new Error('Failed to refresh access token');
        }

        // Update stored token
        await this.prisma.gSCConnection.updateMany({
            where: { userId },
            data: {
                accessToken: credentials.access_token,
                expiry: new Date(credentials.expiry_date),
            },
        });

        return credentials.access_token;
    }

    async checkConnection(userId: string): Promise<boolean> {
        const connection = await this.prisma.gSCConnection.findFirst({
            where: { userId },
        });

        return !!connection;
    }

    async disconnect(userId: string): Promise<void> {
        await this.prisma.gSCConnection.deleteMany({
            where: { userId },
        });
    }
}
