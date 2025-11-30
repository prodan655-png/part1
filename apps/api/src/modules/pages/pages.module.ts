import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { ContentAuditModule } from '../content-audit/content-audit.module';

@Module({
    imports: [ContentAuditModule],
    controllers: [PagesController],
})
export class PagesModule { }
