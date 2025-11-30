'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntegrationsPage() {
    const queryClient = useQueryClient();
    const [connecting, setConnecting] = useState(false);

    const { data: gscStatus } = useQuery({
        queryKey: ['gsc-status'],
        queryFn: async () => {
            const { data } = await api.get('/gsc-auth/status');
            return data;
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: async () => {
            return api.get('/gsc-auth/disconnect');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gsc-status'] });
        },
    });

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const { data } = await api.get('/gsc-auth/connect');
            // Open OAuth URL in new window
            window.location.href = data.authUrl;
        } catch (error) {
            console.error('Failed to initiate OAuth:', error);
            setConnecting(false);
        }
    };

    const handleDisconnect = () => {
        if (confirm('Are you sure you want to disconnect your Google account?')) {
            disconnectMutation.mutate();
        }
    };

    const isConnected = gscStatus?.connected;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Integrations</h1>
                <p className="text-muted-foreground">
                    Connect your accounts to import data and automate your workflow
                </p>
            </div>

            <div className="grid gap-6">
                {/* Google Search Console */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google Search Console
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    Import pages and metrics from your Google Search Console property
                                </CardDescription>
                            </div>
                            {isConnected ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                                <XCircle className="h-6 w-6 text-gray-400" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isConnected ? (
                            <div>
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                                    <p className="text-sm text-green-800">
                                        ✓ Your Google account is connected and ready to import data
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleDisconnect}
                                    disabled={disconnectMutation.isPending}
                                >
                                    {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                    <p className="text-sm text-blue-800">
                                        Connect your Google account to import pages, clicks, impressions, and other metrics from Search Console.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleConnect}
                                    disabled={connecting}
                                >
                                    {connecting ? 'Connecting...' : 'Connect Google Account'}
                                </Button>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2">What we'll access:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• View your Search Console data (read-only)</li>
                                <li>• Import page performance metrics</li>
                                <li>• We will never modify your website or Search Console settings</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Future integrations placeholder */}
                <Card className="opacity-50">
                    <CardHeader>
                        <CardTitle>More Integrations Coming Soon</CardTitle>
                        <CardDescription>
                            We're working on integrations with Google Analytics, Google Ads, and more.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
