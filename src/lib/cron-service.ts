import { getDailyTrends } from '@/lib/trends';
import { prisma } from '@/lib/db';

const COUNTRIES = ['US', 'JP', 'KR', 'CN', 'TW'];

export async function runHourlyJob() {
    console.log('[Scheduler] Starting hourly trend fetch...');
    const timestamp = new Date();
    const results = [];

    for (const geo of COUNTRIES) {
        console.log(`[Scheduler] Fetching trends for ${geo}...`);
        try {
            const trends = await getDailyTrends(geo);

            const dbInserts = trends.map((trend, index) => ({
                timestamp,
                geo,
                rank: index + 1,
                keyword: trend.title.query,
                score: trend.trendScore?.total || 0,
                data: JSON.stringify(trend)
            }));

            await prisma.$transaction(
                dbInserts.map(data => prisma.trendHistory.create({ data }))
            );

            results.push({ geo, count: trends.length });
            console.log(`[Scheduler] Saved ${trends.length} trends for ${geo}`);
        } catch (e) {
            console.error(`[Scheduler] Failed to fetch/save for ${geo}:`, e);
            results.push({ geo, error: String(e) });
        }
    }

    console.log('[Scheduler] Job completed.', results);
    return { success: true, timestamp, results };
}
