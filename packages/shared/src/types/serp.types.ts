export interface SerpProvider {
    search(
        keyword: string,
        country: string,
        maxResults: number,
    ): Promise<SerpResult[]>;
}

export interface SerpResult {
    position: number;
    url: string;
    title: string;
    snippet?: string;
    domain?: string;
}

export interface SerpAnalysisResult {
    keyword: string;
    country: string;
    languageCode: string;
    results: SerpResult[];
    competitorPages: CompetitorPageAnalysis[];
    aggregatedStats: AggregatedStats;
}

export interface CompetitorPageAnalysis {
    url: string;
    position: number;
    wordCount: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    bodyText: string;
    termFrequencies: Record<string, number>;
}

export interface AggregatedStats {
    avgWordCount: number;
    minWordCount: number;
    maxWordCount: number;
    avgH1Count: number;
    avgH2Count: number;
    avgH3Count: number;
    topTerms: TermStatistics[];
}

export interface TermStatistics {
    term: string;
    termNormalized: string;
    importance: number;
    minCount: number;
    maxCount: number;
    avgCount: number;
    percentagePresent: number;
}
