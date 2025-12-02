import { NextResponse } from 'next/server';
import { getDailyTrends } from '@/lib/trends';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Prevent caching

const COUNTRIES = ['US', 'KR', 'JP', 'GB', 'IN', 'BR', 'FR', 'DE'];

export async function GET(request: Request) {
    // Optional: Add authorization check here
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    try {
        const timestamp = new Date();
        const results = [];

        for (const geo of COUNTRIES) {
            console.log(`Fetching trends for ${geo}...`);
            try {
                const trends = await getDailyTrends(geo);

                // Save to DB
                // We'll save the top 20 or all 50? User didn't specify.
                // Saving all 50 might be a lot of rows (50 * 8 = 400 rows/hour).
                // That's ~10k rows/day. SQLite can handle it easily.

                const dbInserts = trends.map((trend, index) => ({
                    timestamp,
                    geo,
                    rank: index + 1,
                    keyword: trend.title.query,
                    score: trend.trendScore?.total || 0,
                    data: JSON.stringify(trend)
                }));

                // Use createMany if supported (SQLite supports it in recent Prisma versions)
                // Or Promise.all with create
                await prisma.$transaction(
                    dbInserts.map(data => prisma.trendHistory.create({ data }))
                );

                results.push({ geo, count: trends.length });
            } catch (e) {
                console.error(`Failed to fetch/save for ${geo}:`, e);
                results.push({ geo, error: String(e) });
            }
        }

        return NextResponse.json({ success: true, timestamp, results });
    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
