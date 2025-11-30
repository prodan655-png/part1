import { PrismaClient } from '@prisma/client';
import { ContentScoringService } from './src/modules/content-audit/services/content-scoring.service';
import { NlpService } from './src/modules/nlp/nlp.service';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting verification...');

    // 1. Create User
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            password: 'hashedpassword',
        },
    });
    console.log('User created:', user.id);

    // 2. Create Site
    const site = await prisma.site.upsert({
        where: { domain: 'example.com' },
        update: {},
        create: {
            domain: 'example.com',
            name: 'Example Site',
            ownerId: user.id,
        },
    });
    console.log('Site created:', site.id);

    // 3. Create Audit Project
    const project = await prisma.auditProject.upsert({
        where: { siteId: site.id },
        update: {},
        create: {
            siteId: site.id,
            gscProperty: 'https://example.com',
            excludedPaths: [],
        },
    });
    console.log('Project created:', project.id);

    // 4. Create Audit Page
    const page = await prisma.auditPage.upsert({
        where: {
            projectId_url: {
                projectId: project.id,
                url: 'https://example.com/seo-guide',
            },
        },
        update: {},
        create: {
            projectId: project.id,
            url: 'https://example.com/seo-guide',
            title: 'Ultimate SEO Guide',
        },
    });
    console.log('Page created:', page.id);

    // 5. Create Guidelines
    await prisma.contentGuidelines.upsert({
        where: { auditPageId: page.id },
        update: {},
        create: {
            auditPageId: page.id,
            keyword: 'seo guide',
            languageCode: 'en',
            country: 'us',
            minWords: 1000,
            maxWords: 2000,
            importantTerms: [
                { term: 'optimization', importance: 5 },
                { term: 'keywords', importance: 4 },
                { term: 'backlinks', importance: 3 },
            ],
        },
    });
    console.log('Guidelines created');

    // 6. Test Scoring Logic Directly
    const nlpService = new NlpService();
    const scoringService = new ContentScoringService(nlpService);

    const pageText = `
    This is the ultimate SEO guide. 
    Search Engine Optimization (SEO) is crucial.
    You need to focus on keywords and backlinks.
    Optimization is key to success.
  `;

    const guidelines = await prisma.contentGuidelines.findUnique({
        where: { auditPageId: page.id },
    });

    if (guidelines) {
        const score = scoringService.calculateScore(pageText, guidelines, 'en');
        console.log('Scoring Result:', JSON.stringify(score, null, 2));
    }

    console.log('Verification complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
