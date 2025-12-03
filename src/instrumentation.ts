export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const cron = await import('node-cron');
        const { runHourlyJob } = await import('@/lib/cron-service');

        // Schedule task to run every 4 hours at minute 0
        cron.schedule('0 */4 * * *', async () => {
            console.log('[Scheduler] Running 4-hourly trend update...');
            await runHourlyJob();
        });

        console.log('[Scheduler] Trend update scheduled (0 */4 * * *).');
    }
}
