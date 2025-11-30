import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListLinkSuggestionsQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by suggestion status',
        enum: ['suggested', 'applied', 'rejected'],
    })
    @IsOptional()
    @IsIn(['suggested', 'applied', 'rejected'])
    status?: string;
}
