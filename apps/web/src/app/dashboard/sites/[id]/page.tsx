'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, BarChart2, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditProjectForm } from '@/components/audit/audit-project-form';
import { PagesTable } from '@/components/pages/pages-table';

export default function SiteDetailsPage() {
    const params = useParams();
    const siteId = params.id as string;
    const queryClient = useQueryClient();

    const { data: site, isLoading } = useQuery({
        queryKey: ['site', siteId],
        queryFn: async () => {
            const { data } = await api.get(`/sites/${siteId}`);
            return data;
        },
    });

    const { data: auditProject } = useQuery({
        queryKey: ['audit-project', siteId],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/sites/${siteId}/audit-project`);
                return data;
            } catch (e) {
                return null;
            }
        },
    });

    const { data: pages = [] } = useQuery({
        queryKey: ['pages', siteId],
        queryFn: async () => {
            if (!auditProject) return [];
            try {
                const { data } = await api.get(`/sites/${siteId}/audit-project/pages`);
                const pages = data.pages || [];
                return pages.map((p: any) => ({
                    ...p,
                    impressions: p.impressions30d,
                    clicks: p.clicks30d,
                    ctr: p.ctr30d,
                    position: p.avgPosition,
                }));
            } catch (e) {
                return [];
            }
        },
        enabled: !!auditProject,
    });

    const importPagesMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/sites/${siteId}/audit-project/import`);
        },
        onSuccess: (data) => {
            alert(`Successfully imported ${data.data.imported} new pages and updated ${data.data.updated} existing pages!`);
            queryClient.invalidateQueries({ queryKey: ['pages', siteId] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to import pages. Make sure you have connected your Google account in Settings > Integrations.');
        },
    });

    const handleImport = () => {
        if (confirm('Import pages from Google Search Console? This may take a few moments.')) {
            importPagesMutation.mutate();
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <Link href="/dashboard/sites" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-2">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sites
                </Link>
                <h1 className="text-3xl font-bold">{site?.domain}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Audit Project</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {auditProject ? (
                            <div>
                                <div className="text-2xl font-bold text-green-600">Active</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {auditProject.gscProperty}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <div className="text-2xl font-bold text-gray-400">Not Configured</div>
                                <p className="text-xs text-muted-foreground mt-2 mb-4">
                                    Configure audit settings to start analyzing pages.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {auditProject?.pages?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Analyzed pages
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Audit Setup Form or Pages Table */}
            {!auditProject ? (
                <div className="max-w-2xl mx-auto">
                    <AuditProjectForm siteId={siteId} />
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Pages</h2>
                        <Button
                            onClick={handleImport}
                            disabled={importPagesMutation.isPending}
                        >
                            {importPagesMutation.isPending ? 'Importing...' : 'Import Pages from GSC'}
                        </Button>
                    </div>
                    <PagesTable pages={pages} siteId={siteId} />
                </div>
            )}
        </div>
    );
}
