import { Agenda } from '@rocket.chat/agenda';
import { cronJobs } from '@rocket.chat/cron';
import { MongoInternals } from 'meteor/mongo';

export const startCron = async () =>
	cronJobs.start(
		new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			defaultConcurrency: 1,
		}),
	);
