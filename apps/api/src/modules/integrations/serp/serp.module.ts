import { Module } from '@nestjs/common';
import { SerpAnalysisService } from './serp-analysis.service';
import { SerperProvider } from './providers/serper.provider';
import { HtmlScraperService } from './html-scraper.service';
import { NlpModule } from '../../nlp/nlp.module';

@Module({
    imports: [NlpModule],
    providers: [SerpAnalysisService, SerperProvider, HtmlScraperService],
    exports: [SerpAnalysisService, HtmlScraperService],
})
export class SerpModule { }
