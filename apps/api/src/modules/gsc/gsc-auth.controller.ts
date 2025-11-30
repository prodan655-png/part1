import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { GscOAuthService } from './gsc-oauth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('gsc-auth')
@Controller('gsc-auth')
export class GscAuthController {
    constructor(private gscOAuth: GscOAuthService) { }

    @Get('connect')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get Google OAuth authorization URL' })
    async connect(@CurrentUser() user: any) {
        const authUrl = this.gscOAuth.getAuthorizationUrl(user.id);
        return { authUrl };
    }

    @Get('callback')
    @ApiOperation({ summary: 'Handle Google OAuth callback' })
    async callback(
        @Query('code') code: string,
        @Query('state') userId: string,
        @Res() res: Response,
    ) {
        try {
            await this.gscOAuth.handleCallback(code, userId);

            // Redirect to frontend success page
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/dashboard/settings/integrations?gsc_connected=true`);
        } catch (error) {
            console.error('OAuth callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/dashboard/settings/integrations?gsc_error=true`);
        }
    }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check GSC connection status' })
    async status(@CurrentUser() user: any) {
        const connected = await this.gscOAuth.checkConnection(user.id);
        return { connected };
    }

    @Get('disconnect')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Disconnect GSC account' })
    async disconnect(@CurrentUser() user: any) {
        await this.gscOAuth.disconnect(user.id);
        return { success: true };
    }
}
