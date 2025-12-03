import { NextResponse } from 'next/server';
import { runHourlyJob } from '@/lib/cron-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const result = await runHourlyJob();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
