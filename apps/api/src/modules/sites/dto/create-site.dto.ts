import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSiteDto {
    @ApiProperty({ example: 'My Awesome Site' })
    @IsString()
    name!: string;

    @ApiProperty({ example: 'example.com' })
    @IsString()
    domain!: string;

    @ApiPropertyOptional({ example: 'us' })
    @IsString()
    @IsOptional()
    defaultCountry?: string;
}
