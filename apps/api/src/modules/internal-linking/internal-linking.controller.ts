import { Controller, Post, Get, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InternalLinkingService } from './internal-linking.service';
import { GenerateLinkSuggestionsDto } from './dto/generate-link-suggestions.dto';
import { ListLinkSuggestionsQueryDto } from './dto/list-link-suggestions-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('internal-linking')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InternalLinkingController {
    constructor(private internalLinkingService: InternalLinkingService) { }

    @Post('pages/:pageId/generate-link-suggestions')
    @ApiOperation({ summary: 'Generate internal link suggestions for a page' })
    async generateSuggestions(
        @CurrentUser() user: any,
        @Param('pageId') pageId: string,
        @Body() dto: GenerateLinkSuggestionsDto,
    ) {
        return this.internalLinkingService.generateSuggestions(
            user.id,
            pageId,
            dto.mode || 'basic',
        );
    }

    @Get('pages/:pageId/link-suggestions')
    @ApiOperation({ summary: 'List internal link suggestions for a page' })
    async listSuggestions(
        @CurrentUser() user: any,
        @Param('pageId') pageId: string,
        @Query() query: ListLinkSuggestionsQueryDto,
    ) {
        return this.internalLinkingService.listSuggestions(user.id, pageId, query.status);
    }

    @Post('link-suggestions/:suggestionId/apply')
    @ApiOperation({ summary: 'Apply an internal link suggestion' })
    async applySuggestion(
        @CurrentUser() user: any,
        @Param('suggestionId') suggestionId: string,
    ) {
        return this.internalLinkingService.applySuggestion(user.id, suggestionId);
    }

    @Post('link-suggestions/:suggestionId/reject')
    @ApiOperation({ summary: 'Reject an internal link suggestion' })
    async rejectSuggestion(
        @CurrentUser() user: any,
        @Param('suggestionId') suggestionId: string,
    ) {
        return this.internalLinkingService.rejectSuggestion(user.id, suggestionId);
    }
}
