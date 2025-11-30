import { Injectable } from '@nestjs/common';
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import { ContentGuidelines } from '@prisma/client';

@Injectable()
export class NlpService {
    private nlp: any;

    constructor() {
        this.nlp = winkNLP(model);
    }

    /**
     * Analyze text to extract basic stats (word count, etc.)
     */
    analyzeText(text: string, _languageCode = 'en') {
        // For now using English model for basic stats as it's lightweight
        // In future, load specific models based on languageCode
        const doc = this.nlp.readDoc(text);

        return {
            wordCount: doc.tokens().length(),
            sentenceCount: doc.sentences().length(),
            readability: 0, // Placeholder for future implementation
        };
    }

    /**
     * Calculate coverage of important terms in the text
     */
    computeTermCoverage(
        text: string,
        guidelines: ContentGuidelines,
        _languageCode = 'en',
    ): {
        score: number;
        missingTerms: string[];
        presentTerms: string[];
    } {
        const doc = this.nlp.readDoc(text.toLowerCase());
        const textContent = doc.out(); // Normalized text

        const importantTerms = guidelines.importantTerms as any[];
        if (!importantTerms || importantTerms.length === 0) {
            return { score: 100, missingTerms: [], presentTerms: [] };
        }

        const missingTerms: string[] = [];
        const presentTerms: string[] = [];
        let weightedPresent = 0;
        let totalWeight = 0;

        for (const termObj of importantTerms) {
            const term = termObj.term.toLowerCase();
            const importance = termObj.importance || 1;
            totalWeight += importance;

            // Simple inclusion check for now. 
            // In production, use n-gram matching or stemming from wink-nlp
            if (textContent.includes(term)) {
                weightedPresent += importance;
                presentTerms.push(term);
            } else {
                missingTerms.push(term);
            }
        }

        const score = totalWeight > 0 ? (weightedPresent / totalWeight) * 100 : 100;

        return {
            score: Math.round(score),
            missingTerms,
            presentTerms,
        };
    }

    /**
     * Extract important keywords from text based on frequency (Simple TF implementation)
     * In a real app, we would use TF-IDF with a corpus or a dedicated library/service.
     */
    extractKeywords(text: string, limit = 10, _languageCode = 'en'): { term: string; count: number; importance: number }[] {
        const doc = this.nlp.readDoc(text.toLowerCase());
        // Get tokens, filter out stop words and punctuation
        const tokens = doc.tokens().filter((t: any) => {
            return t.out(this.nlp.its.type) === 'word' && !t.out(this.nlp.its.stopWordFlag);
        });

        const frequency: Record<string, number> = {};
        tokens.each((t: any) => {
            const word = t.out();
            if (word.length > 2) { // Filter out very short words
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });

        // Convert to array and sort
        const sorted = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        // Normalize importance to 1-10 scale based on max frequency
        const maxFreq = sorted.length > 0 ? sorted[0][1] : 1;

        return sorted.map(([term, count]) => ({
            term,
            count,
            importance: Math.max(1, Math.round((count / maxFreq) * 10)),
        }));
    }
}
