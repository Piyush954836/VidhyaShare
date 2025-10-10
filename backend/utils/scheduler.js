import cron from 'node-cron';
import { runFullMarketUpdate } from '../data-collector/collectJobs.js'; // Adjust the path as needed

/**
 * Schedules the full market data update to run once daily.
 */
export const initializeScheduledJobs = () => {
    console.log("🕒 Cron job scheduler initialized.");

    // Schedule the task to run at 2:00 AM every day.
    // Cron format: 'minute hour day-of-month month day-of-week'
    // '0 2 * * *' means at minute 0 of hour 2, every day.
    cron.schedule('0 2 * * *', async () => {
        console.log('🗓️ [CRON JOB] Starting scheduled full market data update...');
        try {
            await runFullMarketUpdate();
            console.log('✅ [CRON JOB] Scheduled market data update finished successfully.');
        } catch (error) {
            console.error('❌ [CRON JOB] Scheduled market data update failed:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Set to your server's timezone
    });
};