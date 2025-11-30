import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContentAuditService } from './content-audit.service';
import { CreateAuditProjectDto } from './dto/create-audit-project.dto';
import { ListPagesQueryDto } from './dto/list-pages-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('audit')
@Controller('sites/:siteId/audit-project')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentAuditController {
    constructor(private auditService: ContentAuditService) { }

    @Post()
    @ApiOperation({ summary: 'Create an audit project for a site' })
    async create(
        @CurrentUser() user: any,
        @Param('siteId') siteId: string,
        @Body() dto: CreateAuditProjectDto,
    ) {
        return this.auditService.createAuditProject(user.id, siteId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get audit project for a site' })
    async get(@CurrentUser() user: any, @Param('siteId') siteId: string) {
        return this.auditService.getAuditProject(user.id, siteId);
    }

    @Get('pages')
    @ApiOperation({ summary: 'List audit pages with filters and pagination' })
    async listPages(
        @CurrentUser() user: any,
        @Param('siteId') siteId: string,
        @Query() query: ListPagesQueryDto,
    ) {
        return this.auditService.listPages(user.id, siteId, query);
    }

    @Post('import')
    @ApiOperation({ summary: 'Trigger GSC page import' })
    async importPages(@CurrentUser() user: any, @Param('siteId') siteId: string) {
        const project = await this.auditService.getAuditProject(user.id, siteId);
        return this.auditService.importPagesFromGSC(user.id, project.id);
    }

    @Post('pages/:pageId/refresh')
    @ApiOperation({ summary: 'Trigger page analysis refresh' })
    async refreshPage(@CurrentUser() user: any, @Param('pageId') pageId: string) {
        return this.auditService.refreshPageAnalysis(user.id, pageId);
    }
}
