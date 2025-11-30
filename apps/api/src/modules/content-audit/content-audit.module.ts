import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ContentAuditService } from './content-audit.service';
import { ContentAuditController } from './content-audit.controller';
import { ContentScoringService } from './services/content-scoring.service';
import { SitesModule } from '../sites/sites.module';
import { NlpModule } from '../nlp/nlp.module';
import { GscModule } from '../gsc/gsc.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { SerpModule } from '../integrations/serp/serp.module';

@Module({
    imports: [
        SitesModule,
        NlpModule,
        GscModule,
        CrawlerModule,
        SerpModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    url: configService.get('REDIS_URL'),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: 'gsc-sync',
        }),
        BullModule.registerQueue({
            name: 'page-analysis',
        }),
        BullModule.registerQueue({
            name: 'serp-analysis',
        }),
        BullModule.registerQueue({
            name: 'alerts',
        }),
    ],
    controllers: [ContentAuditController],
    providers: [ContentAuditService, ContentScoringService],
    exports: [ContentAuditService],
})
export class ContentAuditModule { }
