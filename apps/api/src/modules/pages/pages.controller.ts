import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContentAuditService } from '../content-audit/content-audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('pages')
@Controller('pages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PagesController {
    constructor(private auditService: ContentAuditService) { }

    @Get(':pageId')
    @ApiOperation({ summary: 'Get page details by ID' })
    async getPage(@CurrentUser() user: any, @Param('pageId') pageId: string) {
        return this.auditService.getPage(user.id, pageId);
    }
}
