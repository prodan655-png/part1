'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ExternalLink, FileText } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface Page {
    id: string;
    url: string;
    title: string | null;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    score: number | null;
    createdAt: string;
}

interface PagesTableProps {
    pages: Page[];
    siteId: string;
}

type SortField = 'url' | 'impressions' | 'clicks' | 'ctr' | 'position' | 'score';
type SortOrder = 'asc' | 'desc';

export function PagesTable({ pages, siteId }: PagesTableProps) {
    const [sortField, setSortField] = useState<SortField>('impressions');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Ensure pages is always an array
    const pagesArray = Array.isArray(pages) ? pages : [];

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const sortedPages = [...pagesArray].sort((a, b) => {
        const aValue = a[sortField] ?? 0;
        const bValue = b[sortField] ?? 0;

        if (sortField === 'url') {
            return sortOrder === 'asc'
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        }

        return sortOrder === 'asc'
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
    });

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const formatPercent = (num: number) => {
        return `${(num * 100).toFixed(2)}%`;
    };

    const formatPosition = (pos: number | undefined | null) => {
        if (pos === undefined || pos === null) return '-';
        return pos.toFixed(1);
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return 'text-gray-400';
        if (score >= 80) return 'text-green-600 font-semibold';
        if (score >= 60) return 'text-yellow-600 font-semibold';
        return 'text-red-600 font-semibold';
    };

    if (pagesArray.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages found</h3>
                <p className="text-gray-600 mb-4">Import pages from Google Search Console to start analyzing.</p>
                <Button>Import Pages</Button>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 -ml-3"
                                onClick={() => handleSort('url')}
                            >
                                URL
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => handleSort('impressions')}
                            >
                                Impressions
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => handleSort('clicks')}
                            >
                                Clicks
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => handleSort('ctr')}
                            >
                                CTR
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => handleSort('position')}
                            >
                                Position
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => handleSort('score')}
                            >
                                Score
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedPages.map((page) => (
                        <TableRow key={page.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium max-w-sm">
                                <Link
                                    href={`/dashboard/pages/${page.id}`}
                                    className="text-blue-600 hover:underline truncate block"
                                >
                                    {page.url}
                                </Link>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                                {page.title || <span className="text-gray-400">No title</span>}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(page.impressions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(page.clicks)}</TableCell>
                            <TableCell className="text-right">{formatPercent(page.ctr)}</TableCell>
                            <TableCell className="text-right">{formatPosition(page.position)}</TableCell>
                            <TableCell className="text-right">
                                <span className={getScoreColor(page.score)}>
                                    {page.score ? page.score.toFixed(0) : '-'}
                                </span>
                            </TableCell>
                            <TableCell>
                                <a
                                    href={page.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
