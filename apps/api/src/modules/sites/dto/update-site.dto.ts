import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSiteDto {
    @ApiPropertyOptional({ example: 'Updated Site Name' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: 'de' })
    @IsString()
    @IsOptional()
    defaultCountry?: string;
}
