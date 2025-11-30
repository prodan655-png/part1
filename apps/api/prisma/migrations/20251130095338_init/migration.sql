-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "defaultCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gsc_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google_search_console',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gsc_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_projects" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "gscProperty" TEXT NOT NULL,
    "primaryCountry" TEXT NOT NULL DEFAULT 'us',
    "maxPages" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_pages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "mainKeyword" TEXT,
    "avgPosition" DOUBLE PRECISION,
    "clicks30d" INTEGER,
    "impressions30d" INTEGER,
    "ctr30d" DOUBLE PRECISION,
    "prevClicks30d" INTEGER,
    "prevImpressions30d" INTEGER,
    "prevCtr30d" DOUBLE PRECISION,
    "contentScore" INTEGER,
    "recommendation" TEXT,
    "recommendationScore" INTEGER,
    "lastAnalysedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_metrics_snapshots" (
    "id" TEXT NOT NULL,
    "auditPageId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "avgPosition" DOUBLE PRECISION NOT NULL,
    "contentScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_metrics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_guidelines" (
    "id" TEXT NOT NULL,
    "auditPageId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "minWords" INTEGER,
    "maxWords" INTEGER,
    "avgWords" INTEGER,
    "avgH1Count" INTEGER,
    "avgH2Count" INTEGER,
    "avgH3Count" INTEGER,
    "importantTerms" JSONB NOT NULL DEFAULT '[]',
    "competitorCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_guidelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_optimize_changes" (
    "id" TEXT NOT NULL,
    "auditPageId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "originalText" TEXT,
    "suggestedText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_optimize_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_link_suggestions" (
    "id" TEXT NOT NULL,
    "auditPageId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'basic',
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_link_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "auditPageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sites_domain_key" ON "sites"("domain");

-- CreateIndex
CREATE INDEX "sites_ownerId_idx" ON "sites"("ownerId");

-- CreateIndex
CREATE INDEX "gsc_connections_userId_idx" ON "gsc_connections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "audit_projects_siteId_key" ON "audit_projects"("siteId");

-- CreateIndex
CREATE INDEX "audit_pages_projectId_idx" ON "audit_pages"("projectId");

-- CreateIndex
CREATE INDEX "audit_pages_mainKeyword_idx" ON "audit_pages"("mainKeyword");

-- CreateIndex
CREATE INDEX "audit_pages_contentScore_idx" ON "audit_pages"("contentScore");

-- CreateIndex
CREATE INDEX "audit_pages_recommendationScore_idx" ON "audit_pages"("recommendationScore");

-- CreateIndex
CREATE UNIQUE INDEX "audit_pages_projectId_url_key" ON "audit_pages"("projectId", "url");

-- CreateIndex
CREATE INDEX "page_metrics_snapshots_auditPageId_idx" ON "page_metrics_snapshots"("auditPageId");

-- CreateIndex
CREATE INDEX "page_metrics_snapshots_periodStart_periodEnd_idx" ON "page_metrics_snapshots"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "content_guidelines_auditPageId_key" ON "content_guidelines"("auditPageId");

-- CreateIndex
CREATE INDEX "content_guidelines_keyword_languageCode_idx" ON "content_guidelines"("keyword", "languageCode");

-- CreateIndex
CREATE INDEX "auto_optimize_changes_auditPageId_idx" ON "auto_optimize_changes"("auditPageId");

-- CreateIndex
CREATE INDEX "auto_optimize_changes_status_idx" ON "auto_optimize_changes"("status");

-- CreateIndex
CREATE INDEX "internal_link_suggestions_auditPageId_idx" ON "internal_link_suggestions"("auditPageId");

-- CreateIndex
CREATE INDEX "internal_link_suggestions_status_idx" ON "internal_link_suggestions"("status");

-- CreateIndex
CREATE INDEX "alerts_auditPageId_idx" ON "alerts"("auditPageId");

-- CreateIndex
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gsc_connections" ADD CONSTRAINT "gsc_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_projects" ADD CONSTRAINT "audit_projects_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_pages" ADD CONSTRAINT "audit_pages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "audit_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_metrics_snapshots" ADD CONSTRAINT "page_metrics_snapshots_auditPageId_fkey" FOREIGN KEY ("auditPageId") REFERENCES "audit_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_guidelines" ADD CONSTRAINT "content_guidelines_auditPageId_fkey" FOREIGN KEY ("auditPageId") REFERENCES "audit_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_optimize_changes" ADD CONSTRAINT "auto_optimize_changes_auditPageId_fkey" FOREIGN KEY ("auditPageId") REFERENCES "audit_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_link_suggestions" ADD CONSTRAINT "internal_link_suggestions_auditPageId_fkey" FOREIGN KEY ("auditPageId") REFERENCES "audit_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_auditPageId_fkey" FOREIGN KEY ("auditPageId") REFERENCES "audit_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
