import { ImportantTerm } from './content.types';

export interface AiService {
    generateAutoOptimizeSuggestions(
        input: AutoOptimizePromptInput,
    ): Promise<AutoOptimizeChangeDraft[]>;
}

export interface AutoOptimizePromptInput {
    pageText: string;
    keyword: string;
    languageCode: string;
    missingTerms: ImportantTerm[];
    underUsedTerms: ImportantTerm[];
    guidelines: {
        recommendedWordCount?: { min?: number; max?: number };
        currentWordCount: number;
    };
}

export interface AutoOptimizeChangeDraft {
    changeType: 'insert' | 'replace' | 'delete';
    location: string; // JSON string: {paragraphIndex, sentenceIndex, etc.}
    originalText?: string;
    suggestedText: string;
    reasoning?: string;
}

export interface AutoOptimizeChange {
    id: string;
    auditPageId: string;
    changeType: string;
    location: string;
    originalText?: string;
    suggestedText: string;
    status: 'suggested' | 'applied' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

export interface AutoOptimizeSuggestionsDto {
    pageId: string;
    changes: AutoOptimizeChange[];
}
