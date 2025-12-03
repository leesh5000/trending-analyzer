export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const cron = await import('node-cron');
        const { runHourlyJob } = await import('@/lib/cron-service');

        // Schedule task to run every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            console.log('[Scheduler] Running hourly trend update...');
            await runHourlyJob();
        });

        console.log('[Scheduler] Hourly trend update scheduled (0 * * * *).');
    }
}
