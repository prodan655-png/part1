export interface ContentGuidelines {
    id: string;
    auditPageId: string;
    keyword: string;
    languageCode: string; // ISO 639-1: en, uk, de, es, fr, etc.
    country: string; // us, ua, de, etc.
    minWords?: number;
    maxWords?: number;
    avgWords?: number;
    avgH1Count?: number;
    avgH2Count?: number;
    avgH3Count?: number;
    importantTerms: ImportantTerm[];
    competitorCount: number;
    lastUpdated: Date;
    createdAt: Date;
}

export interface ImportantTerm {
    term: string; // "search engine optimization"
    termNormalized: string; // normalized/stemmed version
    importance: number; // 0.0 - 1.0 (TF-IDF weight or similar)
    minCount: number; // minimum occurrences in top competitors
    maxCount: number; // maximum occurrences
    avgCount: number; // average occurrences
    percentagePresent: number; // % of competitors using this term
}

export interface ContentScore {
    score: number; // 0-100
    recommendation: string;
    recommendationScore: number;
    breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
    termCoverageScore: number; // 0-100
    lengthScore: number; // 0-100
    headingsScore: number; // 0-100
    termCoverageWeight: number; // e.g., 0.5
    lengthWeight: number; // e.g., 0.3
    headingsWeight: number; // e.g., 0.2
}

export interface TermUsage {
    term: string;
    termNormalized: string;
    recommended: { min: number; max: number; avg: number };
    current: number;
    status: 'missing' | 'under-used' | 'optimal' | 'over-used';
    importance: number;
}

export interface ContentGuidelinesDto {
    keyword: string;
    languageCode: string;
    country: string;
    recommendedWordCount: { min?: number; max?: number; avg?: number };
    recommendedHeadings: { h1?: number; h2?: number; h3?: number };
    importantTerms: ImportantTerm[];
    competitorCount: number;
    lastUpdated: Date;
}
