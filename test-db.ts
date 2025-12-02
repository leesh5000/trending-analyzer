import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB connection...');

    // Create a dummy entry
    const trend = await prisma.trendHistory.create({
        data: {
            geo: 'TEST',
            rank: 1,
            keyword: 'Test Trend',
            score: 100,
            data: JSON.stringify({ title: 'Test' })
        }
    });

    console.log('Created trend:', trend);

    // Read it back
    const count = await prisma.trendHistory.count();
    console.log('Total trends in DB:', count);

    // Clean up
    await prisma.trendHistory.delete({ where: { id: trend.id } });
    console.log('Cleaned up test trend.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
