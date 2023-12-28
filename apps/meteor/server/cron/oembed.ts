import { cronJobs } from '@rocket.chat/cron';
import { Meteor } from 'meteor/meteor';

export async function oembedCron(): Promise<void> {
	await cronJobs.add('Cleanup OEmbed cache', '24 2 * * *', async () => Meteor.callAsync('OEmbedCacheCleanup'));
}
