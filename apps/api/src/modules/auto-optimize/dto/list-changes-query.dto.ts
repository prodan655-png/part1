import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChangeStatus } from '../../../common/shared';

export class ListChangesQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by change status',
        enum: [ChangeStatus.SUGGESTED, ChangeStatus.APPLIED, ChangeStatus.REJECTED],
    })
    @IsOptional()
    @IsIn([ChangeStatus.SUGGESTED, ChangeStatus.APPLIED, ChangeStatus.REJECTED])
    status?: ChangeStatus;
}
