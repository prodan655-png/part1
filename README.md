# SaaS SEO Content Audit Platform

A production-ready monorepo application for SEO content auditing, similar to SurferSEO's Content Audit feature.

## Architecture

**Tech Stack:**
- **Monorepo**: Turborepo with pnpm
- **Backend**: NestJS + Prisma + PostgreSQL + Redis + BullMQ
- **Frontend**: Next.js (App Router) + TailwindCSS + shadcn/ui + Tiptap
- **SERP**: Serper.dev API
- **AI**: Google Gemini
- **NLP**: wink-nlp (multi-language support: en, uk, de, es, fr)

**Workspace Structure:**
```
part1/
├── apps/
│   ├── api/         # NestJS backend API
│   ├── web/         # Next.js frontend
│   └── workers/     # BullMQ background workers
├── packages/
│   └── shared/      # Shared TypeScript types & DTOs
└── docker/          # Docker Compose for local dev
```

## Getting Started

### Prerequisites
- Node.js 18+ (LTS)
- pnpm 8+
- Docker & Docker Compose

### Installation

1. **Clone and install dependencies:**
```bash
cd /Users/yurii/Desktop/part1
./with-node.sh pnpm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start infrastructure (PostgreSQL + Redis):**
```bash
cd docker
docker compose up -d
```

4. **Run database migrations:**
```bash
cd apps/api
../../with-node.sh pnpm prisma:migrate
```

5. **Start development servers:**
```bash
# Terminal 1 - API
cd apps/api
../../with-node.sh pnpm dev

# Terminal 2 - Workers (once implemented)
cd apps/workers
../../with-node.sh pnpm dev

# Terminal 3 - Web (once implemented)
cd apps/web
../../with-node.sh pnpm dev
```

## Features

### Content Audit Dashboard
- Import top pages from Google Search Console
- Track metrics (clicks, impressions, CTR, position)
- Content scoring (0-100) based on SERP analysis
- Best Opportunities recommendations

### Content Guidelines
- SERP-based analysis of top-ranking competitors
- Language-aware recommendations (multi-language support)
- Important terms with coverage analysis
- Word count and headings structure recommendations

### Rich Text Editor
- Tiptap-based editor with audit mode
- Live keyword highlighting
- Real-time content scoring
- Term usage indicators

### Auto-Optimize
- LLM-powered content improvement suggestions
- Minimal, semantically-aware edits
- Accept/reject workflow

### Internal Linking
- Keyword-based link suggestions
- Semantic mode (prepared for embedding-based approach)
- Auto-insertion with anchor text editing

### Background Processing
- All heavy tasks via BullMQ workers (SERP, scraping, LLM, NLP)
- Periodic GSC sync
- Performance alerts

## Database Schema

See `apps/api/prisma/schema.prisma` for the complete schema.

**Key Models:**
- `User` - Authentication
- `Site` - Domain under analysis
- `AuditProject` - Content audit configuration
- `AuditPage` - Individual page with metrics and scores
- `ContentGuidelines` - SERP-derived recommendations with multi-language support
- `AutoOptimizeChange` - LLM suggestions
- `InternalLinkSuggestion` - Internal link recommendations
- `Alert` - Performance change notifications

## Development

**TypeScript:**
- Strict mode enabled
- Path aliases configured (`@/*` for API, `@seo-audit/shared` for shared package)

**Code Quality:**
```bash
pnpm lint        # Lint all workspaces
pnpm type-check  # TypeScript type checking
pnpm format      # Format with Prettier
```

**Testing:**
```bash
cd apps/api
../../with-node.sh pnpm test      # Unit tests
../../with-node.sh pnpm test:e2e  # Integration tests
```

## API Documentation

Once the API is running, visit:
```
http://localhost:3001/api/docs
```

For Swagger/OpenAPI documentation.

## Project Status

Currently implementing Phase 2: Database & Backend Core Setup

See `task.md` for detailed implementation progress.

## License

Private - All rights reserved
