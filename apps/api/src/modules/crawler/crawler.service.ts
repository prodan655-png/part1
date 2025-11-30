import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CrawledPage {
    title: string;
    metaDescription: string;
    content: string;
    h1: string;
}

@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);

    async fetchPageContent(url: string): Promise<CrawledPage> {
        try {
            this.logger.log(`Fetching content for: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'SEO-Audit-Platform-Bot/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                },
                timeout: 10000, // 10 seconds timeout
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // Extract metadata
            const title = $('title').text().trim() || '';
            const metaDescription = $('meta[name="description"]').attr('content')?.trim() ||
                $('meta[property="og:description"]').attr('content')?.trim() || '';
            const h1 = $('h1').first().text().trim() || '';

            // Clean up content
            // Remove scripts, styles, iframes, navs, footers, etc.
            $('script').remove();
            $('style').remove();
            $('iframe').remove();
            $('nav').remove();
            $('footer').remove();
            $('header').remove();
            $('noscript').remove();
            $('[role="navigation"]').remove();
            $('[role="banner"]').remove();
            $('[role="contentinfo"]').remove();

            // Get main content
            // Try to find main content wrapper
            let content = '';
            const mainSelectors = ['main', 'article', '#content', '.content', '#main', '.main'];

            for (const selector of mainSelectors) {
                if ($(selector).length > 0) {
                    content = $(selector).html() || '';
                    break;
                }
            }

            // If no main content found, fallback to body
            if (!content) {
                content = $('body').html() || '';
            }

            // Clean HTML tags but keep structure for editor
            // For now, we store the raw HTML of the content area
            // We might want to sanitize it further later

            return {
                title,
                metaDescription,
                content: content.trim(),
                h1,
            };

        } catch (error) {
            this.logger.error(`Failed to fetch content for ${url}: ${error.message}`);
            throw new Error(`Failed to fetch page content: ${error.message}`);
        }
    }
}
