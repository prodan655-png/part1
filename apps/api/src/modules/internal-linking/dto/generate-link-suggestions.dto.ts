import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateLinkSuggestionsDto {
    @ApiPropertyOptional({
        description: 'Suggestion mode',
        enum: ['basic', 'semantic'],
        default: 'basic',
    })
    @IsOptional()
    @IsIn(['basic', 'semantic'])
    mode?: 'basic' | 'semantic';
}
