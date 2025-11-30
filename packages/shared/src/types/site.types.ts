export interface Site {
    id: string;
    ownerId: string;
    name: string;
    domain: string;
    defaultCountry?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateSiteDto {
    name: string;
    domain: string;
    defaultCountry?: string;
}

export interface UpdateSiteDto {
    name?: string;
    defaultCountry?: string;
}

export interface SiteDto {
    id: string;
    name: string;
    domain: string;
    defaultCountry?: string;
    pageCount?: number;
    lastRefresh?: Date;
    createdAt: Date;
    updatedAt: Date;
}
