import { cronJobs } from '@rocket.chat/cron';
import { settings } from '../../app/settings/server';
import { sendStandupPrompts } from '../lib/standupBot/sendPrompts';
import { postStandupSummary } from '../lib/standupBot/postSummary';

async function runStandupBot(): Promise<void> {
    const enabled = settings.get('Standup_Bot_Enabled');
    if (!enabled) {
        return;
    }
    
    // Send prompts
    await sendStandupPrompts();
    
    // Wait 2 minutes, then post summary (for testing)
    setTimeout(async () => {
        await postStandupSummary();
    }, 8 * 60 * 60 * 1000); // 2 minutes
}

export async function standupBotCron(): Promise<void> {
    const cronSchedule = settings.get<string>('Standup_Bot_Cron') || '*/2 * * * *';
    return cronJobs.add('StandupBot', cronSchedule, async () => runStandupBot());
}
