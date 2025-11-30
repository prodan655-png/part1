import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkGscDto {
    @ApiProperty({ example: '4/0AdQt...' })
    @IsString()
    @IsNotEmpty()
    code!: string;
}
