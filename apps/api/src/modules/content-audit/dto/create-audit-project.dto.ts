import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditProjectDto {
    @ApiProperty({ example: 'https://sc-domain:example.com' })
    @IsString()
    @IsNotEmpty()
    gscProperty!: string;

    @ApiPropertyOptional({ example: 'us' })
    @IsString()
    @IsOptional()
    targetCountry?: string;

    @ApiPropertyOptional({ example: 100 })
    @IsInt()
    @Min(1)
    @IsOptional()
    maxPages?: number;

    @ApiPropertyOptional({ example: ['/blog', '/products'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    excludedPaths?: string[];
}
