'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, BarChart2, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SiteDetailsPage() {
    const params = useParams();
    const siteId = params.id as string;

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
                                <Button size="sm" className="mt-2 w-full">
                                    <Plus className="h-4 w-4 mr-2" /> Setup Audit
                                </Button>
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

            {/* Pages Table Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Pages</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        Pages list will be implemented in the next step.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
