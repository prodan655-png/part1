import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GscService } from './gsc.service';
import { LinkGscDto } from './dto/link-gsc.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('gsc')
@Controller('integrations/gsc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GscController {
    constructor(private gscService: GscService) { }

    @Get('auth-url')
    @ApiOperation({ summary: 'Get Google OAuth URL for GSC connection' })
    getAuthUrl() {
        return { url: this.gscService.getAuthUrl() };
    }

    @Post('link')
    @ApiOperation({ summary: 'Link GSC account using OAuth code' })
    async linkAccount(@CurrentUser() user: any, @Body() dto: LinkGscDto) {
        await this.gscService.linkAccount(user.id, dto.code);
        return { message: 'GSC account linked successfully', connected: true };
    }

    @Get('status')
    @ApiOperation({ summary: 'Check GSC connection status' })
    async getStatus(@CurrentUser() user: any) {
        try {
            await this.gscService.getConnection(user.id);
            return { connected: true };
        } catch (e) {
            return { connected: false };
        }
    }

    @Get('sites')
    @ApiOperation({ summary: 'List verified sites from GSC' })
    async listSites(@CurrentUser() user: any) {
        return this.gscService.listSites(user.id);
    }
}
