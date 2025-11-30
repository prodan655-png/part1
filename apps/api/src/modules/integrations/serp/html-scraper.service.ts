import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
    url: string;
    title: string;
    metaDescription: string;
    h1: string[];
    h2: string[];
    h3: string[];
    bodyText: string;
    wordCount: number;
}

@Injectable()
export class HtmlScraperService {
    private readonly logger = new Logger(HtmlScraperService.name);

    async scrape(url: string): Promise<ScrapedContent | null> {
        try {
            this.logger.log(`Scraping URL: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditBot/1.0; +http://example.com/bot)',
                },
                timeout: 10000, // 10s timeout
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // Remove scripts, styles, and comments
            $('script').remove();
            $('style').remove();
            $('noscript').remove();
            $('iframe').remove();

            const title = $('title').text().trim();
            const metaDescription = $('meta[name="description"]').attr('content') || '';

            const h1 = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
            const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
            const h3 = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean);

            // Extract body text
            // We want main content mostly. For now, we take body text but try to avoid nav/footer if possible.
            // A simple heuristic is to look for <main>, <article>, or fall back to <body>
            let contentRoot = $('main');
            if (contentRoot.length === 0) contentRoot = $('article');
            if (contentRoot.length === 0) contentRoot = $('body');

            const bodyText = contentRoot.text().replace(/\s+/g, ' ').trim();
            const wordCount = bodyText.split(' ').length;

            return {
                url,
                title,
                metaDescription,
                h1,
                h2,
                h3,
                bodyText,
                wordCount,
            };
        } catch (error) {
            this.logger.error(`Failed to scrape ${url}: ${(error as Error).message}`);
            return null;
        }
    }
}
