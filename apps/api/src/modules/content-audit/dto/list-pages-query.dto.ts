import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecommendationLabel } from '../enums/recommendation-label.enum';

export class ListPagesQueryDto {
    @ApiPropertyOptional({ description: 'Search by URL or title' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Minimum content score (0-100)', minimum: 0, maximum: 100 })
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(100)
    @IsOptional()
    contentScoreMin?: number;

    @ApiPropertyOptional({ description: 'Maximum content score (0-100)', minimum: 0, maximum: 100 })
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(100)
    @IsOptional()
    contentScoreMax?: number;

    @ApiPropertyOptional({ description: 'Minimum average position', minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    positionMin?: number;

    @ApiPropertyOptional({ description: 'Maximum average position', minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    positionMax?: number;

    @ApiPropertyOptional({
        description: 'Filter by recommendation label',
        enum: RecommendationLabel,
    })
    @IsEnum(RecommendationLabel)
    @IsOptional()
    recommendation?: RecommendationLabel;

    @ApiPropertyOptional({
        description: 'Sort field',
        enum: ['url', 'contentScore', 'avgPosition', 'clicks30d', 'impressions30d', 'ctr30d'],
        default: 'contentScore',
    })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: ['asc', 'desc'],
        default: 'desc',
    })
    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({ description: 'Page number (1-indexed)', minimum: 1, default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ description: 'Page size', minimum: 1, maximum: 100, default: 20 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    pageSize?: number;
}
