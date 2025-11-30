# Implementation Plan: SaaS SEO Content Audit Platform

A production-ready monorepo application similar to SurferSEO's Content Audit, featuring content scoring, auto-optimization, internal linking, and a rich text editor with live keyword highlighting.

## User Review Required

> [!IMPORTANT]
> **Tech Stack Confirmation**
> - Monorepo: **Turborepo** with **pnpm**
> - Backend: **NestJS** + **Prisma** + **PostgreSQL** + **Redis** + **BullMQ**
> - Frontend: **Next.js (App Router)** + **TailwindCSS** + **shadcn/ui** + **Tiptap**
> - SERP API: **Serper.dev** (https://serper.dev)
> - LLM: **Google Gemini** (primary)

> [!WARNING]
> **External Dependencies**
> The following external services will be required:
> - **Google Search Console API** - OAuth credentials needed
> - **SERP API** (Serper.dev) - API key needed
> - **Google Gemini API** - API key needed
> 
> Initial implementation will include mock/stub responses where API keys are not available.

> [!IMPORTANT]
> **Architecture Principles**
> - **No throwaway code**: All modules designed for production extensibility
> - **Strong typing**: End-to-end TypeScript with shared DTOs
> - **Service abstraction**: SERP, NLP, and AI logic behind interfaces for easy replacement
> - **Background processing**: All heavy tasks (SERP, scraping, LLM) via BullMQ workers
> - **Playwright workers-only**: Browser automation ONLY in background workers, never in HTTP request threads
> - **Multi-language support**: Language code propagated through NLP and analysis pipelines

---

## Proposed Changes

### Monorepo Structure

Creating a Turborepo monorepo with the following workspace structure:

```
part1/
├── apps/
│   ├── api/              # NestJS backend
│   ├── web/              # Next.js frontend
│   └── workers/          # BullMQ background workers
├── packages/
│   └── shared/           # Shared types, DTOs, enums
├── docker/
│   └── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

#### [NEW] [package.json](file:///Users/yurii/Desktop/part1/package.json)
Root package.json with workspace configuration, Turborepo setup, and shared dev dependencies (TypeScript, ESLint, Prettier).

#### [NEW] [pnpm-workspace.yaml](file:///Users/yurii/Desktop/part1/pnpm-workspace.yaml)
pnpm workspace configuration defining `apps/*` and `packages/*`.

#### [NEW] [turbo.json](file:///Users/yurii/Desktop/part1/turbo.json)
Turborepo pipeline configuration for build, dev, lint, and test tasks with proper dependency graph.

#### [NEW] [.eslintrc.js](file:///Users/yurii/Desktop/part1/.eslintrc.js)
Shared ESLint configuration for TypeScript, React, and Node.js.

#### [NEW] [.prettierrc](file:///Users/yurii/Desktop/part1/.prettierrc)
Prettier configuration for consistent code formatting.

#### [NEW] [tsconfig.json](file:///Users/yurii/Desktop/part1/tsconfig.json)
Base TypeScript configuration extended by all workspace packages.

---

### Database Schema (Prisma)

#### [NEW] [schema.prisma](file:///Users/yurii/Desktop/part1/apps/api/prisma/schema.prisma)

Complete Prisma schema with models:
- **User** - Authentication and ownership
- **Site** - Domain under analysis
- **GSCConnection** - Google Search Console OAuth tokens
- **AuditProject** - Content audit configuration per site
- **AuditPage** - Individual page with metrics and scores
- **PageMetricsSnapshot** - Historical metrics storage
- **ContentGuidelines** - SERP-derived recommendations (see detailed schema below)
- **AutoOptimizeChange** - LLM-suggested edits
- **InternalLinkSuggestion** - Internal link recommendations
- **Alert** - Performance change notifications

**ContentGuidelines Model:**
```prisma
model ContentGuidelines {
  id              String   @id @default(cuid())
  auditPageId     String   @unique
  auditPage       AuditPage @relation(fields: [auditPageId], references: [id])
  
  keyword         String   // Main target keyword
  languageCode    String   // e.g., "en", "uk", "de" (ISO 639-1)
  country         String   // e.g., "us", "ua" for SERP locale
  
  // Length recommendations
  minWords        Int?
  maxWords        Int?
  avgWords        Int?
  
  // Headings structure
  avgH1Count      Int?
  avgH2Count      Int?
  avgH3Count      Int?
  
  // Important terms (JSON array)
  // Format: [{"term": "keyword phrase", "importance": 0.95, "minCount": 2, "maxCount": 5, "avgCount": 3}]
  importantTerms  Json     @default("[]")
  
  // Competitor stats
  competitorCount Int      @default(0)
  
  // Metadata
  lastUpdated     DateTime @default(now())
  createdAt       DateTime @default(now())
  
  @@index([keyword, languageCode])
}
```

**ImportantTerm JSON Structure:**
```typescript
interface ImportantTerm {
  term: string;              // "search engine optimization"
  termNormalized: string;    // normalized/stemmed version
  importance: number;        // 0.0 - 1.0 (TF-IDF weight or similar)
  minCount: number;          // minimum occurrences in top competitors
  maxCount: number;          // maximum occurrences
  avgCount: number;          // average occurrences
  percentagePresent: number; // % of competitors using this term
}
```

All relationships properly defined with cascading deletes where appropriate.

---

### Shared Package

#### [NEW] [packages/shared/src/index.ts](file:///Users/yurii/Desktop/part1/packages/shared/src/index.ts)

Exports all shared types, DTOs, and enums.

#### [NEW] [packages/shared/src/types/](file:///Users/yurii/Desktop/part1/packages/shared/src/types/)

Core domain types:
- `user.types.ts` - User, authentication DTOs
- `site.types.ts` - Site DTOs
- `audit.types.ts` - AuditProject, AuditPage DTOs
- `content.types.ts` - ContentGuidelines, ContentScore, Recommendation
- `serp.types.ts` - SERP results, analysis
- `nlp.types.ts` - NLP analysis results
- `ai.types.ts` - AI service interfaces
- `jobs.types.ts` - BullMQ job payloads

#### [NEW] [packages/shared/src/enums/](file:///Users/yurii/Desktop/part1/packages/shared/src/enums/)

Shared enums:
- `recommendation.enum.ts` - Recommendation labels (Best Opportunity, Needs Optimization, etc.)
- `change-status.enum.ts` - suggested/applied/rejected
- `alert-type.enum.ts` - drop/rise/stable

---

### Backend (NestJS) - Core Setup

#### [NEW] [apps/api/src/main.ts](file:///Users/yurii/Desktop/part1/apps/api/src/main.ts)

Bootstrap NestJS application with:
- Global validation pipe
- Swagger/OpenAPI setup
- CORS configuration
- Global exception filters

#### [NEW] [apps/api/src/app.module.ts](file:///Users/yurii/Desktop/part1/apps/api/src/app.module.ts)

Root module importing:
- ConfigModule (environment variables)
- PrismaModule
- RedisModule
- BullModule (queue setup)
- All feature modules

#### [NEW] [apps/api/src/config/](file:///Users/yurii/Desktop/part1/apps/api/src/config/)

Configuration modules:
- `app.config.ts` - App-level config
- `database.config.ts` - Database connection
- `redis.config.ts` - Redis connection
- `auth.config.ts` - JWT secrets
- `external-apis.config.ts` - SERP, GSC, AI API keys

#### [NEW] [apps/api/src/common/](file:///Users/yurii/Desktop/part1/apps/api/src/common/)

Common utilities:
- `prisma/prisma.service.ts` - Prisma client service
- `filters/http-exception.filter.ts` - Global error handling
- `decorators/current-user.decorator.ts` - Extract user from JWT
- `guards/jwt-auth.guard.ts` - JWT authentication guard

---

### Backend - Authentication & Users

#### [NEW] [apps/api/src/modules/auth/](file:///Users/yurii/Desktop/part1/apps/api/src/modules/auth/)

Authentication module:
- `auth.controller.ts` - POST /auth/register, /auth/login, GET /auth/me
- `auth.service.ts` - User registration, login, JWT generation
- `auth.module.ts` - Imports PassportModule, JwtModule
- `strategies/jwt.strategy.ts` - JWT validation strategy
- `dto/register.dto.ts`, `dto/login.dto.ts` - Input validation

#### [NEW] [apps/api/src/modules/users/](file:///Users/yurii/Desktop/part1/apps/api/src/modules/users/)

Users module:
- `users.service.ts` - User CRUD operations
- `users.module.ts`

---

### Backend - Sites Module

#### [NEW] [apps/api/src/modules/sites/](file:///Users/yurii/Desktop/part1/apps/api/src/modules/sites/)

Sites management:
- `sites.controller.ts` - POST/GET/DELETE /sites, GET /sites/:id
- `sites.service.ts` - Site CRUD with user ownership validation
- `sites.module.ts`
- `dto/create-site.dto.ts`, `dto/update-site.dto.ts`

---

### Backend - GSC Integration

#### [NEW] [apps/api/src/modules/integrations/gsc/](file:///Users/yurii/Desktop/part1/apps/api/src/modules/integrations/gsc/)

Google Search Console integration:
- `gsc.controller.ts` - OAuth URL, callback, list properties, link property
- `gsc.service.ts` - OAuth flow, token management, GSC API calls
  - `listPropertiesForUser(userId)`
  - `fetchTopPages(project, startDate, endDate, limit)`
  - `fetchQueriesForUrl(project, url, startDate, endDate)`
- `gsc.module.ts`
- `dto/link-gsc.dto.ts`

OAuth flow handles token refresh automatically.

---

### Backend - SERP Analysis

#### [NEW] [apps/api/src/modules/integrations/serp/](file:///Users/yurii/Desktop/part1/apps/api/src/modules/integrations/serp/)

SERP data fetching and analysis:

**Provider Interface:**
- `providers/serp-provider.interface.ts` - Abstract SERP provider
- `providers/serper-provider.ts` - **Serper.dev implementation (primary)**

**Services:**
- `serp-analysis.service.ts` - High-level SERP analysis orchestration
  - `analyzeKeyword(keyword, country, languageCode, maxResults)` - Fetches SERP, enqueues scraping jobs, aggregates stats
  - `buildContentGuidelines(analysis, languageCode)` - Creates ContentGuidelines from aggregated data
- `html-scraper.service.ts` - Fetches and parses HTML with cheerio
  - **HTTP-first approach**: Uses simple HTTP GET for most pages
  - **Playwright fallback**: ONLY triggered in worker queues for JS-heavy pages
  - Extracts body text, headings structure, word counts
  - Sends `languageCode` to NLP analysis

**Module:**
- `serp.module.ts` - Serper.dev provider configured

> [!CAUTION]
> **Playwright Usage Restriction**
> Playwright is ONLY used in `apps/workers` via the `serp-analysis` queue. The API server (`apps/api`) must NEVER import or use Playwright directly. All browser automation is delegated to background workers.

---

### Backend - NLP Service

#### [NEW] [apps/api/src/modules/nlp/](file:///Users/yurii/Desktop/part1/apps/api/src/modules/nlp/)

NLP text analysis (designed for future Python microservice replacement):

**Interface:**
- `nlp-service.interface.ts` - Abstract NLP service contract

**Implementation:**
- `nlp.service.ts` - TypeScript-based implementation with **multi-language support**
  - `analyzeText(text, languageCode)` - Tokenization, word/term frequencies, readability
    - Language-specific tokenization using `wink-nlp` with language detection
    - Supports: English (en), Ukrainian (uk), German (de), Spanish (es), French (fr), etc.
  - `computeTermCoverage(text, guidelineTerms, languageCode)` - Check coverage of required terms
    - Language-aware stemming and normalization
  - `extractKeyPhrases(text, n, languageCode)` - Basic key phrase extraction
    - Language-specific stopword filtering

**Module:**
- `nlp.module.ts`

**Language Support:**
- `languageCode` (ISO 639-1) propagated from ContentGuidelines → NlpService
- Initial support: en, uk, de, es, fr (extensible)
- Uses `wink-nlp` for multi-language tokenization
- All complex NLP can be replaced by a Python FastAPI service (with spaCy multi-language models) later without changing consumers

---

### Backend - Content Scoring

#### [NEW] [apps/api/src/modules/content-audit/services/content-scoring.service.ts](file:///Users/yurii/Desktop/part1/apps/api/src/modules/content-audit/services/content-scoring.service.ts)

Content scoring logic:

**Methods:**
- `computeContentScore(pageText, guidelines, languageCode)` - Returns 0-100 score
  - Formula breakdown (clearly documented):
    - 50% weight: Coverage of important terms (language-aware matching)
    - 30% weight: Length within recommended range
    - 20% weight: Headings structure match
  - Uses NlpService with `languageCode` for term analysis
- `computeRecommendation(page, score)` - Returns recommendation label and priority score
  - "Best Opportunity" - positions 4-20, low score
  - "Needs Optimization" - low score
  - "Performing Well" - high score
  - "Monitor" - average score

Formula is explicit and easy to tune.

---

### Backend - Content Audit Service

#### [NEW] [apps/api/src/modules/content-audit/content-audit.service.ts](file:///Users/yurii/Desktop/part1/apps/api/src/modules/content-audit/content-audit.service.ts)

High-level audit orchestration:

**Methods:**
- `createAuditProject(siteId, params)` - Create audit configuration
- `importPagesFromGSC(projectId)` - Enqueues job to import top N pages
- `refreshMetrics(projectId)` - Enqueues job to refresh GSC metrics
- `refreshPageAnalysis(pageId)` - Enqueues SERP + scoring job
- `getBestOpportunities(projectId, filters)` - Query optimized pages by criteria
- `getPageDetails(pageId)` - Full page data with metrics, guidelines, queries

Does NOT call external APIs directly - orchestrates via queues.

---

### Backend - AI Service

#### [NEW] [apps/api/src/modules/ai/](file:///Users/yurii/Desktop/part1/apps/api/src/modules/ai/)

LLM integration abstraction:

**Interface:**
- `ai-service.interface.ts` - Abstract AI service contract

**Implementations:**
- `gemini-ai.service.ts` - **Google Gemini implementation (primary)**

**Methods:**
- `generateAutoOptimizeSuggestions(input)` - Returns structured change suggestions
  - Input: page text, guidelines, missing terms, languageCode
  - Output: Array of `{changeType, location, originalText?, suggestedText}`
  - Prompts include language context for proper grammar/tone
- `suggestInternalLinkAnchors(...)` - Optional future enhancement

**Module:**
- `ai.module.ts` - Gemini provider configured via environment variable

---

### Backend - Auto-Optimize Service

#### [NEW] [apps/api/src/modules/content-audit/services/auto-optimize.service.ts](file:///Users/yurii/Desktop/part1/apps/api/src/modules/content-audit/services/auto-optimize.service.ts)

Auto-optimization with LLM:

**Methods:**
- `suggestChanges(pageId, pageText, guidelines)` - Generate and store suggestions
  - Calls `AiService.generateAutoOptimizeSuggestions`
  - Stores `AutoOptimizeChange` records with status="suggested"
- `applyChange(changeId)` - Mark as applied
- `rejectChange(changeId)` - Mark as rejected

Actual text patching happens in frontend editor.

---

### Backend - Internal Linking Service

#### [NEW] [apps/api/src/modules/content-audit/services/internal-linking.service.ts](file:///Users/yurii/Desktop/part1/apps/api/src/modules/content-audit/services/internal-linking.service.ts)

Internal link suggestions:

**Methods:**
- `suggestBasic(projectId, pageId, pageText)` - Keyword-based matching
  - Find other pages with relevant `mainKeyword`
  - Search for keyword occurrences in `pageText`
  - Generate `{sourceUrl, targetUrl, anchorText}` suggestions
- `suggestSemantic(projectId, pageId, pageText)` - Interface for future semantic/embedding approach
  - Initial: returns empty or delegates to basic mode

Stores suggestions in `InternalLinkSuggestion` table.

---

### Backend - Content Audit Controller & Endpoints

#### [NEW] [apps/api/src/modules/content-audit/content-audit.controller.ts](file:///Users/yurii/Desktop/part1/apps/api/src/modules/content-audit/content-audit.controller.ts)

REST API endpoints:
- `POST /sites/:siteId/audit-project` - Create audit project
- `GET /sites/:siteId/audit-project` - Get audit project
- `POST /sites/:siteId/audit-project/import` - Import pages (enqueue job)
- `POST /sites/:siteId/audit-project/refresh-metrics` - Refresh metrics (enqueue job)
- `GET /sites/:siteId/pages` - List pages (paginated, filtered)
- `GET /sites/:siteId/pages/best-opportunities` - Best opportunities view
- `GET /sites/:siteId/pages/:pageId` - Page details
- `POST /sites/:siteId/pages/:pageId/refresh` - Refresh page analysis (enqueue job)
- `GET /sites/:siteId/pages/:pageId/editor-context` - Editor initialization data
- `POST /sites/:siteId/pages/:pageId/auto-optimize/suggest` - Generate suggestions
- `POST /auto-optimize/changes/:changeId/apply` - Apply change
- `POST /auto-optimize/changes/:changeId/reject` - Reject change
- `POST /sites/:siteId/pages/:pageId/internal-links/basic` - Basic internal links
- `POST /sites/:siteId/pages/:pageId/internal-links/semantic` - Semantic internal links

All endpoints use JWT auth and validate user ownership.

---

### Backend - BullMQ Workers

#### [NEW] [apps/workers/src/main.ts](file:///Users/yurii/Desktop/part1/apps/workers/src/main.ts)

Worker process bootstrap connecting to Redis and registering queue processors.

#### [NEW] [apps/workers/src/queues/](file:///Users/yurii/Desktop/part1/apps/workers/src/queues/)

Queue processors:

**gsc-sync queue:**
- `gsc-sync.processor.ts` - Processes GSC import and refresh jobs
  - `import-pages` job: Fetches top N pages from GSC, upserts `AuditPage` records
  - `refresh-metrics` job: Fetches metrics for existing pages, creates `PageMetricsSnapshot`

**serp-analysis queue:**
- `serp-analysis.processor.ts` - Processes SERP fetching and analysis
  - `analyze-keyword` job: Fetches SERP, scrapes competitor pages, builds `ContentGuidelines`

**page-analysis queue:**
- `page-analysis.processor.ts` - Processes page content scoring
  - `score-page` job: Fetches page HTML, runs NLP, computes ContentScore, saves recommendation

**alerts queue:**
- `alerts.processor.ts` - Evaluates metric changes and creates alerts
  - `evaluate-alerts` job: Compares current vs previous metrics, creates `Alert` records

**Schedulers:**
- `schedulers/gsc-sync.scheduler.ts` - Daily GSC sync for all active projects
- `schedulers/alerts.scheduler.ts` - Daily alert evaluation

All queues configured with retry logic and error handling.

---

### Backend - Alerts Module

#### [NEW] [apps/api/src/modules/alerts/](file:///Users/yurii/Desktop/part1/apps/api/src/modules/alerts/)

Alerts management:
- `alerts.controller.ts` - GET /alerts, GET /sites/:siteId/alerts
- `alerts.service.ts` - Query alerts, mark as read
- `alerts.module.ts`

---

### Frontend - Next.js Setup

#### [NEW] [apps/web/app/layout.tsx](file:///Users/yurii/Desktop/part1/apps/web/app/layout.tsx)

Root layout with providers:
- TanStack Query provider
- Authentication provider
- Tailwind styles

#### [NEW] [apps/web/app/(public)/](file:///Users/yurii/Desktop/part1/apps/web/app/(public)/)

Public pages:
- `page.tsx` - Landing page
- `login/page.tsx` - Login form
- `register/page.tsx` - Registration form

#### [NEW] [apps/web/app/(app)/](file:///Users/yurii/Desktop/part1/apps/web/app/(app)/)

Authenticated app layout with navigation.

---

### Frontend - Sites Management

#### [NEW] [apps/web/app/(app)/sites/page.tsx](file:///Users/yurii/Desktop/part1/apps/web/app/(app)/sites/page.tsx)

Sites list:
- Table with name, domain, country, page count
- "Add Site" button opening modal
- Row click navigates to audit

#### [NEW] [apps/web/app/(app)/sites/[siteId]/settings/page.tsx](file:///Users/yurii/Desktop/part1/apps/web/app/(app)/sites/[siteId]/settings/page.tsx)

Site settings:
- GSC connection flow
- Site configuration

---

### Frontend - Content Audit Dashboard

#### [NEW] [apps/web/app/(app)/sites/[siteId]/audit/page.tsx](file:///Users/yurii/Desktop/part1/apps/web/app/(app)/sites/[siteId]/audit/page.tsx)

Content Audit table:
- TanStack Table with columns: URL, Title, Main Keyword, ContentScore, Recommendation, Clicks, Impressions, CTR, Position
- Filters: search, score slider, position slider
- "Best Opportunities" toggle
- Row click opens side panel

#### [NEW] [apps/web/components/audit/page-details-panel.tsx](file:///Users/yurii/Desktop/part1/apps/web/components/audit/page-details-panel.tsx)

Side panel showing:
- Page URL
- Main keyword (editable dropdown)
- Metrics with deltas
- ContentScore, recommendation
- Tabs: Metrics, Queries
- "Open in Editor" button

---

### Frontend - Rich Text Editor

#### [NEW] [apps/web/app/(app)/editor/[pageId]/page.tsx](file:///Users/yurii/Desktop/part1/apps/web/app/(app)/editor/[pageId]/page.tsx)

Editor layout:
- Tiptap editor (left/center)
- Sidebar (right) with ContentScore and guidelines

#### [NEW] [apps/web/components/editor/tiptap-editor.tsx](file:///Users/yurii/Desktop/part1/apps/web/components/editor/tiptap-editor.tsx)

Tiptap editor component:
- Extensions: Heading, Paragraph, Bold, Italic, BulletList, OrderedList, Link
- Custom decorations for keyword highlighting
- State managed with Zustand

#### [NEW] [apps/web/components/editor/sidebar.tsx](file:///Users/yurii/Desktop/part1/apps/web/components/editor/sidebar.tsx)

Editor sidebar:
- ContentScore badge (large, colored)
- Guidelines panel:
  - Recommended word count
  - Recommended headings count
  - Terms list with usage indicators (used/missing/over-used)

#### [NEW] [apps/web/components/editor/keyword-highlighter.ts](file:///Users/yurii/Desktop/part1/apps/web/components/editor/keyword-highlighter.ts)

Tiptap plugin for keyword highlighting using decorations:
- Highlights missing/under-used terms
- Updates on content change (debounced)

---

### Frontend - Auto-Optimize UI

#### [NEW] [apps/web/components/editor/auto-optimize-panel.tsx](file:///Users/yurii/Desktop/part1/apps/web/components/editor/auto-optimize-panel.tsx)

Auto-optimize suggestions panel:
- "Auto-Optimize" button triggers suggestion generation
- List of suggestions showing original vs suggested snippets
- Accept/Reject buttons
- Accepting updates Tiptap editor content

---

### Frontend - Internal Linking UI

#### [NEW] [apps/web/components/editor/internal-links-panel.tsx](file:///Users/yurii/Desktop/part1/apps/web/components/editor/internal-links-panel.tsx)

Internal links panel:
- "Insert Internal Links (Basic)" button
- "Insert Internal Links (Semantic)" button
- List of suggestions with target URL and anchor text
- Apply/Edit/Reject actions
- Visual highlighting of newly inserted links

---

### Docker Compose for Local Development

#### [NEW] [docker/docker-compose.yml](file:///Users/yurii/Desktop/part1/docker/docker-compose.yml)

Services:
- `postgres` - PostgreSQL 15
- `redis` - Redis 7
- `api` - NestJS backend (development mode)
- `workers` - BullMQ workers (development mode)
- `web` - Next.js frontend (development mode)

Volume mounts for hot reload. Exposed ports for local access.

---

## Verification Plan

### Automated Tests

**Backend Unit Tests:**
```bash
cd apps/api
pnpm test
```

Coverage for:
- `ContentScoringService.computeContentScore` - Various inputs, edge cases
- `ContentAuditService.getBestOpportunities` - Filter logic
- `NlpService.analyzeText` - Tokenization accuracy
- `NlpService.computeTermCoverage` - Coverage calculation
- `InternalLinkingService.suggestBasic` - Link matching logic

**Backend Integration Tests:**
```bash
cd apps/api
pnpm test:e2e
```

Key flows:
- User registration → login → JWT auth
- Create site → link GSC → create audit project
- Import pages from GSC (mocked)
- List pages with filters
- Refresh page analysis (mocked SERP and LLM)

**Frontend Unit Tests:**
```bash
cd apps/web
pnpm test
```

Component tests for:
- TanStack Table filtering and pagination
- Tiptap editor initialization
- Keyword highlighting logic

### Manual Verification

**Local Development:**
1. Start infrastructure: `docker compose up postgres redis`
2. Run migrations: `cd apps/api && pnpm prisma migrate dev`
3. Start backend: `cd apps/api && pnpm dev`
4. Start workers: `cd apps/workers && pnpm dev`
5. Start frontend: `cd apps/web && pnpm dev`

**User Flows to Test:**
1. Register new user → login
2. Add new site
3. Connect GSC (with mock OAuth for now)
4. Create audit project
5. Import pages (verify job enqueued and processed)
6. View Content Audit table:
   - Filter by score, position
   - Check "Best Opportunities"
   - Open page details panel
7. Open editor:
   - Verify ContentScore and guidelines display
   - Type in editor, observe keyword highlighting
   - Click "Auto-Optimize", verify suggestions appear
   - Accept suggestion, verify editor updates
   - Click "Insert Internal Links", verify links inserted

**API Documentation:**
- Open `http://localhost:3000/api/docs` for Swagger UI
- Verify all endpoints documented
- Test endpoints via Swagger

**Database Inspection:**
- Connect to PostgreSQL: `psql -h localhost -U postgres -d seo_audit`
- Verify schema matches Prisma models
- Check data integrity after operations

**Redis/Queue Monitoring:**
- Use Bull Board (optionally integrated) to monitor queues
- Verify jobs are processed successfully
- Check retry behavior on failures

### Code Quality Checks

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Format check
pnpm format:check
```

All checks must pass before considering implementation complete.
