import { Injectable } from '@nestjs/common';
import { NlpService } from '../../nlp/nlp.service';
import { ContentGuidelines } from '@prisma/client';
// import { RecommendationLabel } from '../enums/recommendation-label.enum';

@Injectable()
export class ContentScoringService {
    constructor(private nlpService: NlpService) { }

    calculateScore(
        pageText: string,
        guidelines: ContentGuidelines,
        languageCode = 'en',
    ): {
        contentScore: number;
        recommendation: string;
        recommendationScore: number;
    } {
        // 1. Term Coverage Score (50% weight)
        const termAnalysis = this.nlpService.computeTermCoverage(
            pageText,
            guidelines,
            languageCode,
        );
        const termScore = termAnalysis.score;

        // 2. Length Score (30% weight)
        const lengthAnalysis = this.nlpService.analyzeText(pageText, languageCode);
        const lengthScore = this.calculateLengthScore(
            lengthAnalysis.wordCount,
            guidelines.minWords || 0,
            guidelines.maxWords || 0,
        );

        // 3. Headings Score (20% weight)
        // For now assuming 100, will implement HTML parsing later
        const headingsScore = 100;

        // Weighted Total
        const totalScore = Math.round(
            termScore * 0.5 + lengthScore * 0.3 + headingsScore * 0.2,
        );

        return {
            contentScore: totalScore,
            recommendation: this.getRecommendationLabel(totalScore),
            recommendationScore: this.calculateRecommendationScore(totalScore),
        };
    }

    private calculateLengthScore(
        actual: number,
        min: number,
        max: number,
    ): number {
        if (min === 0 && max === 0) return 100;
        if (actual >= min && (max === 0 || actual <= max)) return 100;

        // Penalize if outside range
        if (actual < min) {
            return Math.max(0, 100 - ((min - actual) / min) * 100);
        }
        if (max > 0 && actual > max) {
            return Math.max(0, 100 - ((actual - max) / max) * 50); // Less penalty for overage
        }
        return 100;
    }

    private getRecommendationLabel(score: number): string {
        if (score >= 80) return 'Performing Well';
        if (score >= 50) return 'Monitor';
        return 'Needs Optimization';
    }

    private calculateRecommendationScore(contentScore: number): number {
        // Priority score: Lower content score = Higher priority
        return 100 - contentScore;
    }
}
