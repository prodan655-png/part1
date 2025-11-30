import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    AutoOptimizePromptInput,
    AutoOptimizeChangeDraft,
} from '../../common/shared';

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private genAI!: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY not configured. AI features will be disabled.');
            return;
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.0-flash as per user feedback
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                // responseMimeType: 'application/json', // Removed to fix type error
            },
        });

        this.logger.log('Gemini AI initialized with model: gemini-2.0-flash');
    }

    async generateAutoOptimizeSuggestions(
        input: AutoOptimizePromptInput,
    ): Promise<AutoOptimizeChangeDraft[]> {
        if (!this.model) {
            throw new Error('Gemini AI not configured. Please set GEMINI_API_KEY.');
        }

        const prompt = this.buildAutoOptimizePrompt(input);

        try {
            this.logger.log(`Generating auto-optimize suggestions for keyword: ${input.keyword}`);

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            this.logger.debug(`Gemini response: ${text.substring(0, 200)}...`);

            // Parse JSON response with error handling
            const changes = this.parseGeminiResponse(text);

            this.logger.log(`Generated ${changes.length} suggestions`);
            return changes;
        } catch (error) {
            this.logger.error('Failed to generate suggestions from Gemini:', error);
            throw new Error(`AI suggestion generation failed: ${(error as Error).message}`);
        }
    }

    private buildAutoOptimizePrompt(input: AutoOptimizePromptInput): string {
        const missingTermsList = input.missingTerms
            .map((t) => `- "${t.term}" (importance: ${t.importance.toFixed(2)})`)
            .join('\n');

        const underUsedTermsList = input.underUsedTerms
            .map((t: any) => `- "${t.term}" (current: ${t.currentCount}, recommended: ${t.avgCount})`)
            .join('\n');

        const wordCountGuidance = input.guidelines.recommendedWordCount
            ? `Recommended: ${input.guidelines.recommendedWordCount.min}-${input.guidelines.recommendedWordCount.max} words`
            : 'No specific word count guidance';

        return `You are an expert SEO content optimizer.

CONTEXT:
- Target keyword: "${input.keyword}"
- Language: ${input.languageCode}
- Current word count: ${input.guidelines.currentWordCount}
- ${wordCountGuidance}

MISSING IMPORTANT TERMS:
${missingTermsList || '(none)'}

UNDERUSED TERMS:
${underUsedTermsList || '(none)'}

CURRENT CONTENT:
${input.pageText}

TASK:
Generate 3-7 minimal, natural content improvements to boost SEO while maintaining readability.

RULES:
1. Use natural, fluent language matching the original tone
2. Integrate missing/underused terms contextually, not force them
3. Preserve the page's core message and style
4. Focus on semantic relevance, not keyword stuffing
5. Suggest specific edits with clear locations

OUTPUT FORMAT (JSON array):
[
  {
    "changeType": "insert|replace|delete",
    "location": "{\\"paragraphIndex\\": 2, \\"sentenceIndex\\": 1}",
    "originalText": "text to replace (for replace type only)",
    "suggestedText": "new or replacement text",
    "reasoning": "Brief explanation of why this improves SEO"
  }
]

LOCATION FORMAT:
- location is a JSON string with paragraphIndex (0-indexed) and optionally sentenceIndex
- For insert: position where to add new content
- For replace: position of text to replace
- For delete: position of text to remove

Return ONLY the JSON array, no additional text.`;
    }

    private parseGeminiResponse(responseText: string): AutoOptimizeChangeDraft[] {
        try {
            // Clean up markdown code blocks if present
            let cleanText = responseText.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Try to parse directly as JSON
            let parsed = JSON.parse(cleanText);

            // Handle if response is wrapped in extra object
            if (parsed.changes) {
                parsed = parsed.changes;
            }

            // Validate it's an array
            if (!Array.isArray(parsed)) {
                this.logger.warn('Gemini response is not an array, attempting to extract...');
                // Try to find JSON array in text
                const match = cleanText.match(/\[[\s\S]*\]/);
                if (match) {
                    parsed = JSON.parse(match[0]);
                } else {
                    throw new Error('Could not find JSON array in response');
                }
            }

            // Validate and normalize each change
            const changes: AutoOptimizeChangeDraft[] = parsed.map((change: any, index: number) => {
                // Validate required fields
                if (!change.changeType || !change.suggestedText) {
                    throw new Error(`Invalid change at index ${index}: missing required fields`);
                }

                // Validate changeType
                if (!['insert', 'replace', 'delete'].includes(change.changeType)) {
                    throw new Error(`Invalid changeType at index ${index}: ${change.changeType}`);
                }

                // Ensure location is valid JSON string
                let location = change.location || '{}';
                if (typeof location === 'object') {
                    // If Gemini returned object instead of string, stringify it
                    location = JSON.stringify(location);
                } else {
                    // Validate it's parseable JSON
                    try {
                        JSON.parse(location);
                    } catch {
                        this.logger.warn(`Invalid location JSON at index ${index}, using default`);
                        location = JSON.stringify({ paragraphIndex: 0 });
                    }
                }

                return {
                    changeType: change.changeType,
                    location,
                    originalText: change.originalText,
                    suggestedText: change.suggestedText,
                    reasoning: change.reasoning,
                };
            });

            return changes;
        } catch (error) {
            this.logger.error('Failed to parse Gemini response:', error);
            this.logger.debug('Raw response:', responseText);
            throw new Error(`Failed to parse AI response: ${(error as Error).message}`);
        }
    }
}
