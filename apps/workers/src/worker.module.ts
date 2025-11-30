import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../api/src/common/prisma/prisma.module';
import { GscModule } from '../../api/src/modules/integrations/gsc/gsc.module';
import { NlpModule } from '../../api/src/modules/nlp/nlp.module';
import { SerpModule } from '../../api/src/modules/integrations/serp/serp.module';
import { GscSyncProcessor } from './processors/gsc-sync.processor';
import { PageAnalysisProcessor } from './processors/page-analysis.processor';
import { SerpAnalysisProcessor } from './processors/serp-analysis.processor';
import { AlertsProcessor } from './processors/alerts.processor';
import { ContentScoringService } from '../../api/src/modules/content-audit/services/content-scoring.service';
import { SchedulerService } from './scheduler.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../.env',
        }),
        ScheduleModule.forRoot(),
        PrismaModule,
        GscModule,
        NlpModule,
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
    providers: [
        GscSyncProcessor,
        PageAnalysisProcessor,
        SerpAnalysisProcessor,
        AlertsProcessor,
        ContentScoringService,
        SchedulerService,
    ],
})
export class WorkerModule { }

