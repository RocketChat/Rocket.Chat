import { Meteor } from 'meteor/meteor';

import { defaultCronJobs } from '../../app/utils/server/lib/cron/Cronjobs';

export async function oembedCron(): Promise<void> {
	await defaultCronJobs.add('Cleanup OEmbed cache', '24 2 * * *', async () => Meteor.callAsync('OEmbedCacheCleanup'));
}
