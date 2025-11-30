'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Sparkles } from 'lucide-react';
import api from '@/lib/api';

interface AISuggestionsPanelProps {
    pageId: string;
    onApplyChange: (original: string, suggested: string) => void;
}

interface Suggestion {
    id: string;
    changeType: 'insert' | 'replace' | 'delete';
    originalText: string;
    suggestedText: string;
    status: 'suggested' | 'applied' | 'rejected';
    location: string;
}

export function AISuggestionsPanel({ pageId, onApplyChange }: AISuggestionsPanelProps) {
    const queryClient = useQueryClient();

    const { data: suggestionsData, isLoading } = useQuery({
        queryKey: ['ai-suggestions', pageId],
        queryFn: async () => {
            const { data } = await api.get(`/pages/${pageId}/auto-optimize-changes`);
            return data;
        },
    });

    const generateSuggestionsMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/pages/${pageId}/auto-optimize`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-suggestions', pageId] });
        },
    });

    const applySuggestionMutation = useMutation({
        mutationFn: async (suggestionId: string) => {
            return api.post(`/auto-optimize/${suggestionId}/apply`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-suggestions', pageId] });
        },
    });

    const rejectSuggestionMutation = useMutation({
        mutationFn: async (suggestionId: string) => {
            return api.post(`/auto-optimize/${suggestionId}/reject`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-suggestions', pageId] });
        },
    });

    const handleApply = (suggestion: Suggestion) => {
        onApplyChange(suggestion.originalText, suggestion.suggestedText);
        applySuggestionMutation.mutate(suggestion.id);
    };

    const suggestions = suggestionsData?.changes || [];
    const pendingSuggestions = suggestions.filter((s: Suggestion) => s.status === 'suggested');

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    AI Suggestions
                </CardTitle>
                <CardDescription>
                    Optimize your content with AI
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                {pendingSuggestions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No pending suggestions.</p>
                        <Button
                            onClick={() => generateSuggestionsMutation.mutate()}
                            disabled={generateSuggestionsMutation.isPending}
                        >
                            {generateSuggestionsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Analyze Content
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-muted-foreground">{pendingSuggestions.length} suggestions found</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateSuggestionsMutation.mutate()}
                                disabled={generateSuggestionsMutation.isPending}
                            >
                                Re-analyze
                            </Button>
                        </div>
                        {pendingSuggestions.map((suggestion: Suggestion) => (
                            <div key={suggestion.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={suggestion.changeType === 'insert' ? 'default' : suggestion.changeType === 'delete' ? 'destructive' : 'secondary'}>
                                        {suggestion.changeType}
                                    </Badge>
                                </div>

                                {suggestion.originalText && (
                                    <div className="text-sm bg-red-50 p-2 rounded text-red-700 line-through">
                                        {suggestion.originalText}
                                    </div>
                                )}
                                <div className="text-sm bg-green-50 p-2 rounded text-green-700">
                                    {suggestion.suggestedText}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => rejectSuggestionMutation.mutate(suggestion.id)}
                                        disabled={rejectSuggestionMutation.isPending}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleApply(suggestion)}
                                        disabled={applySuggestionMutation.isPending}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
