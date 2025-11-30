import { Module } from '@nestjs/common';
import { GscService } from './gsc.service';
import { GscController } from './gsc.controller';

@Module({
    controllers: [GscController],
    providers: [GscService],
    exports: [GscService],
})
export class GscModule { }
