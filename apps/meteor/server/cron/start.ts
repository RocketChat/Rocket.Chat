import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { MongoInternals } from 'meteor/mongo';

export const startCron = async () => {
	return cronJobs.start((MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(), new Logger('CRONJOBS'));
};
