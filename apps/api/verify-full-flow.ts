import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function main() {
    console.log('Starting full flow verification...');

    // 1. Create User
    const user = await prisma.user.upsert({
        where: { email: 'fullflow@example.com' },
        update: {},
        create: {
            email: 'fullflow@example.com',
            password: 'hashedpassword',
        },
    });
    console.log('User created:', user.id);

    // 2. Create Site
    const site = await prisma.site.upsert({
        where: { domain: 'fullflow.com' },
        update: {},
        create: {
            domain: 'fullflow.com',
            name: 'Full Flow Site',
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
            gscProperty: 'https://fullflow.com',
            excludedPaths: [],
        },
    });
    console.log('Project created:', project.id);

    // 4. Create Audit Page
    // We use a real URL that we know exists and has content, e.g., example.com
    // But wait, example.com is very simple. Let's use something slightly more complex or just example.com
    const testUrl = 'https://example.com';

    const page = await prisma.auditPage.upsert({
        where: {
            projectId_url: {
                projectId: project.id,
                url: testUrl,
            },
        },
        update: {
            guidelines: { delete: true }, // Clear existing guidelines to force regeneration
            contentScore: null,
            recommendation: null,
        },
        create: {
            projectId: project.id,
            url: testUrl,
            title: 'Example Domain',
            mainKeyword: 'domain', // Keyword to analyze
        },
    });
    console.log('Page created/reset:', page.id);

    // 5. Trigger Analysis directly via Queue (simulating Controller/Service)
    // We connect to the queue manually here
    const pageAnalysisQueue = new Queue('page-analysis', { connection: redis });

    await pageAnalysisQueue.add('score-page', {
        pageId: page.id,
    });
    console.log('Analysis job enqueued');

    // 6. Poll for results
    console.log('Waiting for analysis to complete...');
    let attempts = 0;
    while (attempts < 30) { // Wait up to 60 seconds
        await new Promise(r => setTimeout(r, 2000));

        const updatedPage = await prisma.auditPage.findUnique({
            where: { id: page.id },
            include: { guidelines: true },
        });

        if (updatedPage?.contentScore !== null) {
            console.log('Analysis complete!');
            console.log('Score:', updatedPage?.contentScore);
            console.log('Recommendation:', updatedPage?.recommendation);
            console.log('Guidelines:', updatedPage?.guidelines ? 'Created' : 'Missing');
            if (updatedPage?.guidelines) {
                console.log('Important Terms:', updatedPage.guidelines.importantTerms);
            }
            break;
        }

        process.stdout.write('.');
        attempts++;
    }

    if (attempts >= 30) {
        console.log('\nTimeout waiting for analysis.');
    }

    console.log('\nVerification finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        redis.disconnect();
    });
