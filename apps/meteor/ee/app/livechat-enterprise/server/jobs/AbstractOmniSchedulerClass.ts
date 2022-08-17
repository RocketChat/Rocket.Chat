import { Agenda } from '@rocket.chat/agenda';
import { MongoInternals } from 'meteor/mongo';
import type { Collection } from 'mongodb';

import { schedulerLogger } from '../lib/logger';

const SCHEDULER_NAME = 'omnichannel_scheduler';

export abstract class AbstractOmniSchedulerClass {
	scheduler: Agenda;

	abstract createJobDefinition(): void;

	abstract createIndexes(collection: Collection): void;

	protected constructor() {
		const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

		this.scheduler = new Agenda({
			mongo: db as any,
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});

		this.scheduler.on('ready', async () =>
			this.scheduler.start().then(() => {
				schedulerLogger.info(`${SCHEDULER_NAME} started`);
			}),
		);

		process.on('SIGINT', () => {
			schedulerLogger.info(`SIGINT received. Stopping ${SCHEDULER_NAME}...`);
			this.scheduler.stop();
		});
		process.on('SIGTERM', () => {
			schedulerLogger.info(`SIGTERM received. Stopping ${SCHEDULER_NAME}...`);
			this.scheduler.stop();
		});

		this.createJobDefinition();

		this.createIndexes(db.collection(SCHEDULER_NAME));
	}
}
