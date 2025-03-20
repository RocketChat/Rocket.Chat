import { cronJobs } from '@rocket.chat/cron';
import { MongoInternals } from 'meteor/mongo';

export const startCron = async () => {
	return cronJobs.start((MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db());
};
