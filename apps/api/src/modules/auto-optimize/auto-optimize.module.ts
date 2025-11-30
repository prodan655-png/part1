import { Module } from '@nestjs/common';
import { AutoOptimizeService } from './auto-optimize.service';
import { AutoOptimizeController } from './auto-optimize.controller';
import { AiModule } from '../ai/ai.module';
import { NlpModule } from '../nlp/nlp.module';
import { SerpModule } from '../integrations/serp/serp.module';

@Module({
    imports: [AiModule, NlpModule, SerpModule],
    providers: [AutoOptimizeService],
    controllers: [AutoOptimizeController],
    exports: [AutoOptimizeService],
})
export class AutoOptimizeModule { }
