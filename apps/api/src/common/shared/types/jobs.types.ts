// BullMQ Job Payloads

export interface GscImportPagesJobPayload {
    projectId: string;
    maxPages: number;
    startDate: string; // ISO date
    endDate: string; // ISO date
}

export interface GscRefreshMetricsJobPayload {
    projectId: string;
    pageIds?: string[]; // if empty, refresh all pages
}

export interface SerpAnalysisJobPayload {
    keyword: string;
    country: string;
    languageCode: string;
    maxResults: number;
    auditPageId?: string; // optional: associate with a specific page
}

export interface PageAnalysisJobPayload {
    pageId: string;
    url: string;
    forceRefresh?: boolean;
}

export interface AlertsEvaluationJobPayload {
    projectId?: string; // if empty, evaluate all projects
}

export interface ScrapePageJobPayload {
    url: string;
    usePlaywright?: boolean; // true for JS-heavy pages
    languageCode: string;
}
