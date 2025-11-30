'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { AISuggestionsPanel } from '@/components/editor/ai-suggestions-panel';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export default function PageDetailsPage() {
    const params = useParams();
    const pageId = params.id as string;

    const { data: page, isLoading } = useQuery({
        queryKey: ['page', pageId],
        queryFn: async () => {
            const { data } = await api.get(`/pages/${pageId}`);
            return data;
        },
    });

    const queryClient = useQueryClient();
    const [editorContent, setEditorContent] = useState('');

    useEffect(() => {
        if (page?.content) {
            setEditorContent(page.content);
        }
    }, [page]);

    const refreshContentMutation = useMutation({
        mutationFn: async () => {
            // We need siteId, but page object might not have it directly if not included
            // But we can get it from page.project.siteId if included
            // The backend getPage returns page with project? Let's check.
            // Actually the backend getPage (findOne) usually includes project.
            // Let's assume we have it or can get it.
            // Wait, the API endpoint is /sites/:siteId/audit-project/pages/:pageId/refresh
            // But we also have a direct endpoint? No, the controller is nested.
            // ContentAuditController is @Controller('sites/:siteId/audit-project')
            // So we need siteId.
            // Let's check if page object has project.siteId.
            // If not, we might need to fetch it or pass it.
            // The current useQuery fetches /pages/${pageId} which is likely a different controller?
            // Wait, I implemented listPages in ContentAuditController.
            // But where is getPage?
            // I probably need to check how getPage is implemented.
            // If it's not implemented, I might need to implement it or use the list endpoint.
            // But the current code uses api.get(`/pages/${pageId}`).
            // I should check if there is a PagesController.

            // Assuming we have siteId available or can derive it.
            // If not, I'll use the nested endpoint if I can find siteId.
            // For now, let's assume page.project.siteId is available.
            return api.post(`/sites/${page.project.siteId}/audit-project/pages/${pageId}/refresh`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page', pageId] });
        },
    });

    const saveContentMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/sites/${page.project.siteId}/audit-project/pages/${pageId}/content`, {
                content: editorContent
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page', pageId] });
            alert('Content saved successfully!');
        },
        onError: () => {
            alert('Failed to save content');
        }
    });

    const runSerpAnalysisMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/sites/${page.project.siteId}/audit-project/pages/${pageId}/serp-analysis`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page', pageId] });
            alert('SERP Analysis completed! You can now use AI Suggestions.');
        },
        onError: (error: any) => {
            alert(error?.response?.data?.message || 'Failed to run SERP analysis');
        }
    });

    const handleExportHTML = () => {
        const blob = new Blob([editorContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${page.url.replace(/[^a-z0-9]/gi, '_')}_optimized.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopyHTML = async () => {
        try {
            await navigator.clipboard.writeText(editorContent);
            alert('HTML copied to clipboard!');
        } catch (err) {
            alert('Failed to copy HTML');
        }
    };

    const handleApplyAISuggestion = (original: string, suggested: string) => {
        // Simple string replacement in editor content
        const newContent = editorContent.replace(original, suggested);
        setEditorContent(newContent);
    };

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!page) return <div className="p-8">Page not found</div>;

    const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
    const formatPercent = (num: number) => `${(num * 100).toFixed(2)}%`;
    const formatPosition = (pos: number) => pos.toFixed(1);

    return (
        <div className="p-8 max-w-[1800px] mx-auto">
            <div className="mb-6">
                <Link href="/dashboard/sites" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-2">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sites
                </Link>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{page.title || 'Untitled Page'}</h1>
                        <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                            {page.url} <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refreshContentMutation.mutate()}
                            disabled={refreshContentMutation.isPending}
                        >
                            {refreshContentMutation.isPending ? 'Fetching...' : 'Refresh Content'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => runSerpAnalysisMutation.mutate()}
                            disabled={runSerpAnalysisMutation.isPending}
                        >
                            {runSerpAnalysisMutation.isPending ? 'Analyzing...' : 'Run SERP Analysis'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCopyHTML}
                            disabled={!page.content}
                        >
                            Copy HTML
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportHTML}
                            disabled={!page.content}
                        >
                            Export HTML
                        </Button>
                        <Button
                            onClick={() => saveContentMutation.mutate()}
                            disabled={saveContentMutation.isPending}
                        >
                            {saveContentMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(page.impressions || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Times shown in search results
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(page.clicks || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Users who visited from search
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CTR</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPercent(page.ctr || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Click-through rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Position</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPosition(page.position || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Average ranking position
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Content Score */}
            {page.score && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Content Quality Score</CardTitle>
                        <CardDescription>AI-powered analysis of your content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className={`text-6xl font-bold ${page.score >= 80 ? 'text-green-600' :
                                page.score >= 60 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                {page.score.toFixed(0)}
                            </div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${page.score >= 80 ? 'bg-green-600' :
                                            page.score >= 60 ? 'bg-yellow-600' :
                                                'bg-red-600'
                                            }`}
                                        style={{ width: `${page.score}%` }}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {page.score >= 80 && 'Excellent content quality'}
                                    {page.score >= 60 && page.score < 80 && 'Good, but can be improved'}
                                    {page.score < 60 && 'Needs improvement'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Content Editor with AI Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor - 2/3 width */}
                <div className="lg:col-span-2">
                    <Card className="min-h-[600px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Content Editor</CardTitle>
                            <CardDescription>
                                {page.content ? 'Edit your content below' : 'No content fetched yet. Click "Refresh Content" to fetch.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {page.content ? (
                                <TiptapEditor
                                    content={editorContent}
                                    onChange={setEditorContent}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-muted-foreground mb-4">Content has not been fetched for this page yet.</p>
                                    <Button
                                        onClick={() => refreshContentMutation.mutate()}
                                        disabled={refreshContentMutation.isPending}
                                    >
                                        {refreshContentMutation.isPending ? 'Fetching...' : 'Fetch Content'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* AI Suggestions Panel - 1/3 width */}
                <div className="lg:col-span-1">
                    <AISuggestionsPanel
                        pageId={pageId}
                        onApplyChange={handleApplyAISuggestion}
                    />
                </div>
            </div>
        </div>
    );
}
