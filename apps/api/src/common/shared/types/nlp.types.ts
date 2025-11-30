export interface NlpService {
    analyzeText(text: string, languageCode: string): Promise<NlpAnalysis>;
    computeTermCoverage(
        text: string,
        guidelineTerms: string[],
        languageCode: string,
    ): Promise<TermCoverageResult>;
    extractKeyPhrases(
        text: string,
        n: number,
        languageCode: string,
    ): Promise<KeyPhrase[]>;
}

export interface NlpAnalysis {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    avgSentenceLength: number;
    termFrequencies: Record<string, number>;
    normalizedTermFrequencies: Record<string, number>; // stemmed/lemmatized
    readabilityScore?: number;
}

export interface TermCoverageResult {
    termsCovered: string[];
    termsMissing: string[];
    termUsage: Record<string, number>; // term -> count
    coveragePercentage: number;
}

export interface KeyPhrase {
    phrase: string;
    score: number;
    frequency: number;
}
