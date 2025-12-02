import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const timestampStr = searchParams.get('timestamp');
    const geo = searchParams.get('geo') || 'US';

    if (!timestampStr) {
        return NextResponse.json({ error: 'Timestamp is required' }, { status: 400 });
    }

    try {
        const targetDate = new Date(timestampStr);

        // Define a window (e.g., +/- 30 minutes) to find the snapshot
        // Since cron runs hourly, we should find records with the exact same timestamp usually.
        // But to be safe, let's look for the closest snapshot within the hour.

        const startWindow = new Date(targetDate.getTime() - 30 * 60 * 1000);
        const endWindow = new Date(targetDate.getTime() + 30 * 60 * 1000);

        const historyItems = await prisma.trendHistory.findMany({
            where: {
                geo,
                timestamp: {
                    gte: startWindow,
                    lte: endWindow
                }
            },
            orderBy: {
                rank: 'asc'
            }
        });

        // Parse the 'data' JSON string back to object
        const trends = historyItems.map((item: { data: string }) => {
            try {
                return JSON.parse(item.data);
            } catch (e) {
                console.error('Failed to parse trend data', e);
                return null;
            }
        }).filter(Boolean);

        return NextResponse.json({ trends });
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
