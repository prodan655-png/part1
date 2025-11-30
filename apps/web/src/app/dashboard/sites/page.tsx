'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Globe, Search, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Site {
    id: string;
    domain: string;
    createdAt: string;
    _count: {
        auditProjects: number;
    };
}

export default function SitesPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const queryClient = useQueryClient();

    // Fetch sites
    const { data: sites, isLoading } = useQuery({
        queryKey: ['sites'],
        queryFn: async () => {
            const { data } = await api.get<Site[]>('/sites');
            return data;
        },
    });

    // Create site mutation
    const createSite = useMutation({
        mutationFn: async (domain: string) => {
            return api.post('/sites', {
                name: domain, // Use domain as name
                domain
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            setIsAddOpen(false);
            setNewDomain('');
        },
    });

    // Delete site mutation
    const deleteSite = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/sites/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
        },
    });

    const handleAddSite = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDomain) {
            createSite.mutate(newDomain);
        }
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center">Loading sites...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
                    <p className="text-muted-foreground mt-1">Manage your websites and audit projects.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Site
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Site</DialogTitle>
                            <DialogDescription>
                                Enter the domain name of the website you want to audit.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSite}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="domain">Domain</Label>
                                    <Input
                                        id="domain"
                                        placeholder="example.com"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={createSite.isPending}>
                                    {createSite.isPending ? 'Adding...' : 'Add Site'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {sites?.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No sites added</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                        You haven't added any websites yet. Add your first site to start auditing content.
                    </p>
                    <Button onClick={() => setIsAddOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Site
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {sites?.map((site) => (
                        <Card key={site.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-lg font-semibold">{site.domain}</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this site?')) {
                                                deleteSite.mutate(site.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardDescription className="mt-2">
                                    Added on {new Date(site.createdAt).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Audit Projects:</span>
                                    <span className="font-medium">{site._count?.auditProjects || 0}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 p-4">
                                <Link href={`/dashboard/sites/${site.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        View Details <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
