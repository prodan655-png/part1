import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AutoOptimizeService } from './auto-optimize.service';
import { ListChangesQueryDto } from './dto/list-changes-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auto-optimize')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AutoOptimizeController {
    constructor(private autoOptimizeService: AutoOptimizeService) { }

    @Post('pages/:pageId/auto-optimize')
    @ApiOperation({ summary: 'Generate AI-powered content optimization suggestions' })
    async generateSuggestions(
        @CurrentUser() user: any,
        @Param('pageId') pageId: string,
    ) {
        return this.autoOptimizeService.generateSuggestions(user.id, pageId);
    }

    @Get('pages/:pageId/auto-optimize-changes')
    @ApiOperation({ summary: 'List all auto-optimize suggestions for a page' })
    async listChanges(
        @CurrentUser() user: any,
        @Param('pageId') pageId: string,
        @Query() query: ListChangesQueryDto,
    ) {
        return this.autoOptimizeService.listChanges(user.id, pageId, query.status);
    }

    @Post('auto-optimize/:changeId/apply')
    @ApiOperation({ summary: 'Apply an auto-optimize suggestion' })
    async applySuggestion(
        @CurrentUser() user: any,
        @Param('changeId') changeId: string,
    ) {
        return this.autoOptimizeService.applySuggestion(user.id, changeId);
    }

    @Post('auto-optimize/:changeId/reject')
    @ApiOperation({ summary: 'Reject an auto-optimize suggestion' })
    async rejectSuggestion(
        @CurrentUser() user: any,
        @Param('changeId') changeId: string,
    ) {
        return this.autoOptimizeService.rejectSuggestion(user.id, changeId);
    }
}
