import { NextResponse } from 'next/server';
import { getDailyTrends } from '@/lib/trends';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const geo = searchParams.get('geo') || 'US';

    try {
        // 1. Check for fresh data in DB (within last 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Find the most recent snapshot timestamp for this geo
        const latestSnapshot = await prisma.trendHistory.findFirst({
            where: {
                geo,
                timestamp: {
                    gte: oneHourAgo
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            select: {
                timestamp: true
            }
        });

        if (latestSnapshot) {
            // Fetch all trends for this specific snapshot timestamp
            // This ensures we get a consistent set of rankings from the same crawl
            const cachedTrends = await prisma.trendHistory.findMany({
                where: {
                    geo,
                    timestamp: latestSnapshot.timestamp
                },
                orderBy: {
                    rank: 'asc'
                }
            });

            if (cachedTrends.length > 0) {
                console.log(`[Cache Hit] Serving ${cachedTrends.length} trends for ${geo} from DB`);
                const trends = cachedTrends.map((item: { data: string }) => {
                    try {
                        return JSON.parse(item.data);
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean);

                return NextResponse.json({ trends, source: 'cache' });
            }
        }

        // 2. Fallback: Fetch live data
        console.log(`[Cache Miss] Fetching live trends for ${geo}`);
        const trends = await getDailyTrends(geo);

        // Save to DB for future cache hits
        try {
            const timestamp = new Date();
            const dbInserts = trends.map((trend, index) => ({
                timestamp,
                geo,
                rank: index + 1,
                keyword: trend.title.query,
                score: trend.trendScore?.total || 0,
                data: JSON.stringify(trend)
            }));

            // Use transaction to ensure atomicity
            await prisma.$transaction(
                dbInserts.map(data => prisma.trendHistory.create({ data }))
            );
            console.log(`[Cache Update] Saved ${trends.length} trends for ${geo} to DB`);
        } catch (saveError) {
            console.error('Failed to save trends to cache:', saveError);
            // Don't fail the request if saving fails, just log it
        }

        return NextResponse.json({ trends, source: 'live' });
    } catch (error) {
        console.error('Failed to fetch trends:', error);
        return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }
}
