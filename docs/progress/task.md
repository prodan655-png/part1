# SaaS SEO Content Audit Platform - Implementation Tasks

## Phase 1: Monorepo & Infrastructure Setup
- [x] Initialize Turborepo monorepo with pnpm
- [x] Set up workspace structure (apps/api, apps/web, apps/workers, packages/shared)
- [x] Configure TypeScript with path aliases
- [x] Set up ESLint + Prettier
- [x] Create Docker Compose for local development (PostgreSQL, Redis)
- [x] Configure environment variables structure

## Phase 2: Database & Shared Packages
- [x] Design and implement Prisma schema
- [x] Create shared types and DTOs in packages/shared
- [x] Set up database migrations
- [x] Create seed data for development

## Phase 3: Backend - Core NestJS Setup
- [x] Bootstrap NestJS application in apps/api
- [x] Set up authentication module (JWT-based)
- [x] Implement users module with basic CRUD
- [x] Configure Swagger/OpenAPI documentation
- [x] Set up global error handling and validation

## Phase 4: Backend - Sites & GSC Integration
- [x] Implement sites module (CRUD operations)
- [x] Create GSC integration module
  - [x] OAuth flow implementation
  - [x] Token management and refresh
  - [x] List properties
  - [x] Fetch top pages
  - [x] Fetch queries for URLs
- [x] Create API endpoints for sites and GSC

## Phase 5: Backend - Content Audit Core
- [/] Implement ContentAuditService
  - [x] Create audit project
  - [x] Fetch and store page metrics (GSC sync)
  - [x] Calculate content scores
- [x] Implement ContentGuidelinesService
  - [x] SERP analysis integration
  - [x] NLP processing for keywords
  - [x] Generate recommendations page metrics snapshot storage
- [ ] Create pages listing with filters and pagination

## Phase 6: Backend - SERP & NLP Analysis
- [x] Design SerpProvider interface
- [x] Implement DataForSEO/SerpApi provider
- [x] Create SERPAnalysisService
  - [x] Fetch SERP results
  - [x] Parse competitor HTML (cheerio)
  - [x] Build content guidelines
- [x] Implement NlpService
  - [x] Tokenization
  - [x] Word frequency analysis
  - [x] Term coverage computation
- [x] Create ContentScoringService
  - [x] Implement scoring formula
  - [x] Compute recommendations
  - [x] Calculate recommendation scores

## Phase 7: Backend - BullMQ Workers
- [ ] Set up BullMQ queues infrastructure
- [ ] Implement gsc-sync queue and processors
- [ ] Implement serp-analysis queue and processors
- [ ] Implement page-analysis queue and processors
- [ ] Implement alerts queue and processors
- [ ] Set up scheduled jobs for periodic refresh
- [ ] Create workers app bootstrap

## Phase 8: Backend - AI & Auto-Optimize
- [ ] Design AiService interface
- [ ] Implement OpenAI/Gemini integration
- [ ] Create AutoOptimizeService
  - [ ] Generate suggestions
  - [ ] Apply/reject changes
- [ ] Create auto-optimize endpoints

## Phase 9: Backend - Internal Linking
- [ ] Implement InternalLinkingService
  - [ ] Basic keyword matching mode
  - [ ] Semantic mode (interface prepared)
- [ ] Create internal linking endpoints

## Phase 10: Backend - Alerts
- [ ] Implement alerts evaluation logic
- [ ] Create alerts endpoints
- [ ] Set up alert notifications

## Phase 11: Frontend - Next.js Setup
- [ ] Bootstrap Next.js with App Router
- [ ] Configure TailwindCSS + shadcn/ui
- [ ] Set up React Query for data fetching
- [ ] Create authentication pages (login/register)
- [ ] Implement protected route layout

## Phase 12: Frontend - Sites Management
- [ ] Create sites list page
- [ ] Implement Add Site modal
- [ ] Create site settings page
- [ ] Implement GSC connection flow

## Phase 13: Frontend - Content Audit Dashboard
- [ ] Create audit table with TanStack Table
- [ ] Implement filters (search, score, position)
- [ ] Create page details side panel
- [ ] Implement Best Opportunities view
- [ ] Add refresh and import actions

## Phase 14: Frontend - Rich Text Editor
- [ ] Set up Tiptap editor
- [ ] Implement editor layout with sidebar
- [ ] Create ContentScore display
- [ ] Implement ContentGuidelines panel
- [ ] Add live keyword highlighting with decorations
- [ ] Implement local content analysis (debounced)

## Phase 15: Frontend - Auto-Optimize UI
- [ ] Create Auto-Optimize suggestions panel
- [ ] Implement suggestion preview (original vs suggested)
- [ ] Add Accept/Reject actions
- [ ] Apply changes to Tiptap document

## Phase 16: Frontend - Internal Linking UI
- [ ] Create internal links suggestions panel
- [ ] Implement link insertion into Tiptap
- [ ] Add anchor text editing
- [ ] Visual highlighting for new links

## Phase 17: Testing & Documentation
- [ ] Write unit tests for core services
- [ ] Write integration tests for key flows
- [ ] Complete Swagger/OpenAPI documentation
- [ ] Create README with architecture overview
- [ ] Document deployment process

## Phase 18: Polish & Production Readiness
- [ ] Performance optimization
- [ ] Error handling review
- [ ] Security audit
- [ ] Production environment configuration
- [ ] Monitoring and logging setup
