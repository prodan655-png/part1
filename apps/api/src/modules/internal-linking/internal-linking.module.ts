import { Module } from '@nestjs/common';
import { InternalLinkingService } from './internal-linking.service';
import { InternalLinkingController } from './internal-linking.controller';

@Module({
    providers: [InternalLinkingService],
    controllers: [InternalLinkingController],
    exports: [InternalLinkingService],
})
export class InternalLinkingModule { }
