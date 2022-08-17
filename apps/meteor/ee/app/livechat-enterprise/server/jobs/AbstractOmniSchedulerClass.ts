import { Agenda } from '@rocket.chat/agenda';
import { MongoInternals } from 'meteor/mongo';
import type { CreateIndexesOptions, Db, IndexSpecification } from 'mongodb';

import { schedulerLogger } from '../lib/logger';

const SCHEDULER_NAME = 'omnichannel_scheduler';

export abstract class AbstractOmniSchedulerClass {
	scheduler: Agenda;

	logger = schedulerLogger;

	db: Db;

	abstract createJobDefinition(): void;

	abstract getIndexesForDB(): { indexSpec: IndexSpecification; options?: CreateIndexesOptions }[];

	protected constructor() {
		const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

		this.scheduler = new Agenda({
			mongo: db as any,
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});

		this.db = db;

		this.scheduler.on('ready', async () =>
			this.scheduler.start().then(() => {
				this.logger.info(`${SCHEDULER_NAME} started`);
			}),
		);

		process.on('SIGINT', () => {
			this.logger.info(`SIGINT received. Stopping ${SCHEDULER_NAME}...`);
			this.scheduler.stop();
		});
		process.on('SIGTERM', () => {
			this.logger.info(`SIGTERM received. Stopping ${SCHEDULER_NAME}...`);
			this.scheduler.stop();
		});
	}

	public async init() {
		this.logger.info(`Initializing ${SCHEDULER_NAME}...`);
		this.createJobDefinition();
		this.logger.info(`${SCHEDULER_NAME} initialized. Creating indexes now...`);
		const indexes = this.getIndexesForDB();
		for await (const { indexSpec, options } of indexes) {
			if (options) {
				await this.db.collection(SCHEDULER_NAME).createIndex(indexSpec, options);
			} else {
				await this.db.collection(SCHEDULER_NAME).createIndex(indexSpec);
			}
		}
		this.logger.info(`${SCHEDULER_NAME} indexes created.`);
	}
}
