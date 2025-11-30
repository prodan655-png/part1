# Phase 6: SERP & NLP Analysis - Walkthrough

## Overview
This phase focused on implementing the core analysis engine for the Content Audit platform. We integrated SERP data fetching, HTML scraping, and NLP-based keyword extraction to generate content guidelines and scores.

## Changes

### 1. HTML Scraping
- **Service**: `HtmlScraperService` (`apps/api/src/modules/integrations/serp/html-scraper.service.ts`)
- **Tech**: `cheerio`, `axios`
- **Functionality**: Fetches URL content, removes clutter (scripts, styles), extracts metadata (title, description), headings (h1-h3), and body text.

### 2. SERP Integration
- **Provider**: `SerperProvider` (`apps/api/src/modules/integrations/serp/providers/serper.provider.ts`)
- **API**: `https://google.serper.dev/search`
- **Logic**: Fetches top organic results for a keyword. Falls back to mock data if `SERPER_API_KEY` is missing.

### 3. NLP Analysis
- **Service**: `NlpService` (`apps/api/src/modules/nlp/nlp.service.ts`)
- **Enhancement**: Added `extractKeywords` method using word frequency analysis (TF-like) to identify important terms from competitor content.

### 4. Analysis Orchestration
- **Service**: `SerpAnalysisService` (`apps/api/src/modules/integrations/serp/serp-analysis.service.ts`)
- **Flow**:
  1. Fetch SERP results for the target keyword.
  2. Scrape content from top 5 competitors.
  3. Aggregate metrics (word count, headings count).
  4. Extract important terms from combined competitor text.
  5. Generate and save `ContentGuidelines`.
  6. Trigger page scoring.

### 5. Background Processing
- **Processors**:
  - `PageAnalysisProcessor`: Now fetches content if missing using `HtmlScraperService`. Checks for guidelines. If missing, triggers SERP analysis. If present, calculates score.
  - `SerpAnalysisProcessor`: Runs SERP analysis and triggers re-scoring.

## Verification

### Full Flow Test
We ran a verification script `apps/api/verify-full-flow.ts` that:
1. Created a User, Site, and Audit Project.
2. Created an Audit Page with a target keyword.
3. Triggered the `score-page` job.
4. Verified that:
   - Content was fetched (simulated via `example.com`).
   - Guidelines were missing initially.
   - SERP analysis was triggered.
   - Guidelines were created (with terms like "domain", "examples").
   - Content score was calculated.

### Results
- **Score**: Calculated based on term coverage and length.
- **Guidelines**: Successfully generated from scraped content.
- **Status**: `Performing Well` / `Monitor` / `Needs Optimization`.

## Next Steps
- Phase 7: BullMQ Workers (Refining queues, adding alerts)
- Phase 8: AI & Auto-Optimize (Gemini integration)
