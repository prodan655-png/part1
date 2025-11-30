import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SerpResult {
    position: number;
    title: string;
    link: string;
    snippet: string;
}

@Injectable()
export class SerperProvider {
    private readonly logger = new Logger(SerperProvider.name);
    private readonly apiKey: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('SERPER_API_KEY') || '';
    }

    async search(keyword: string, country = 'us', language = 'en'): Promise<SerpResult[]> {
        if (!this.apiKey) {
            this.logger.warn('SERPER_API_KEY not found, using mock data');
            return this.getMockData(keyword);
        }

        try {
            this.logger.log(`Searching for "${keyword}" in ${country}/${language} via Serper.dev`);

            const response = await axios.post(
                'https://google.serper.dev/search',
                {
                    q: keyword,
                    gl: country,
                    hl: language,
                },
                {
                    headers: {
                        'X-API-KEY': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const organic = response.data.organic || [];
            return organic.map((item: any) => ({
                position: item.position,
                title: item.title,
                link: item.link,
                snippet: item.snippet,
            }));
        } catch (error) {
            this.logger.error(`Serper.dev API failed: ${(error as Error).message}`);
            // Fallback to mock on error to keep flow running
            return this.getMockData(keyword);
        }
    }

    private getMockData(keyword: string): SerpResult[] {
        return Array.from({ length: 10 }).map((_, i) => ({
            position: i + 1,
            title: `Result ${i + 1} for ${keyword}`,
            link: `https://example.com/result-${i + 1}`,
            snippet: `This is a mock snippet for result ${i + 1} containing ${keyword}.`,
        }));
    }
}
