import { cronJobs } from '@rocket.chat/cron';

import { executeClearOEmbedCache } from '../methods/OEmbedCacheCleanup';

export async function oembedCron(): Promise<void> {
	return cronJobs.add('Cleanup OEmbed cache', '24 2 * * *', async () => executeClearOEmbedCache());
}
