import { RecommendationLabel } from '../enums/recommendation.enum';

export interface AuditProject {
    id: string;
    siteId: string;
    gscProperty: string;
    primaryCountry: string;
    maxPages: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAuditProjectDto {
    gscProperty: string;
    primaryCountry: string;
    maxPages?: number;
}

export interface AuditPage {
    id: string;
    projectId: string;
    url: string;
    title?: string;
    mainKeyword?: string;
    avgPosition?: number;
    clicks30d?: number;
    impressions30d?: number;
    ctr30d?: number;
    prevClicks30d?: number;
    prevImpressions30d?: number;
    prevCtr30d?: number;
    contentScore?: number;
    recommendation?: string;
    recommendationScore?: number;
    lastAnalysedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface PageMetricsSnapshot {
    id: string;
    auditPageId: string;
    periodStart: Date;
    periodEnd: Date;
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
    contentScore?: number;
    createdAt: Date;
}

export interface AuditPageDto {
    id: string;
    url: string;
    title?: string;
    mainKeyword?: string;
    avgPosition?: number;
    clicks30d?: number;
    impressions30d?: number;
    ctr30d?: number;
    clicksDelta?: number;
    impressionsDelta?: number;
    ctrDelta?: number;
    contentScore?: number;
    recommendation?: RecommendationLabel;
    recommendationScore?: number;
    lastAnalysedAt?: Date;
}

export interface PageDetailsDto extends AuditPageDto {
    prevClicks30d?: number;
    prevImpressions30d?: number;
    prevCtr30d?: number;
    topQueries?: PageQuery[];
}

export interface PageQuery {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface ListPagesDto {
    pages: AuditPageDto[];
    total: number;
    page: number;
    pageSize: number;
}

export interface PageFilters {
    search?: string;
    contentScoreMin?: number;
    contentScoreMax?: number;
    positionMin?: number;
    positionMax?: number;
    recommendation?: RecommendationLabel;
    page?: number;
    pageSize?: number;
}
