import type { Job } from '@rocket.chat/agenda';
import { Agenda } from '@rocket.chat/agenda';
import type { IRoom } from '@rocket.chat/core-typings';
import type { Db } from 'mongodb';

import { ServiceClassInternal } from '../../../../server/sdk/types/ServiceClass';
import { schedulerLogger } from '../../../app/livechat-enterprise/server/lib/logger';
import { OmniEEService } from '../../sdk';
import type { IOmniJobSchedulerService } from '../../sdk/types/IOmniJobSchedularService';

const SCHEDULER_NAME = 'omnichannel_scheduler';

export enum OMNI_JOB_NAME {
	AUTO_CLOSE_ON_HOLD_CHAT = 'auto-close-on-hold-chat',
	AUTO_TRANSFER_UNANSWERED_CHAT = 'auto-transfer-unanswered-chat',
}

export type OmniOnHoldJobData = {
	roomId: IRoom['_id'];
	comment: string;
};

export type OmniAutoTransferUnansweredChatJobData = {
	roomId: IRoom['_id'];
};

export class OmniJobSchedulerService extends ServiceClassInternal implements IOmniJobSchedulerService {
	protected name = 'omni-job-scheduler';

	scheduler: Agenda;

	logger = schedulerLogger;

	db: Db;

	constructor(db: Db) {
		super();

		this.scheduler = new Agenda({
			mongo: db as any,
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});

		this.db = db;

		this.scheduler.on('ready', async () =>
			this.scheduler.start().then(() => {
				this.logger.debug(`${SCHEDULER_NAME} started`);
			}),
		);

		process.on('SIGINT', () => {
			this.logger.debug(`SIGINT received. Stopping ${SCHEDULER_NAME}...`);
			this.scheduler.stop();
		});
		process.on('SIGTERM', () => {
			this.logger.debug(`SIGTERM received. Stopping ${SCHEDULER_NAME}...`);
			this.scheduler.stop();
		});

		this.init();
	}

	async init(): Promise<void> {
		this.logger.debug(`Creating job definitions for ${SCHEDULER_NAME}`);
		this.scheduler.define(OMNI_JOB_NAME.AUTO_CLOSE_ON_HOLD_CHAT, OmniEEService.autoCloseOnHoldChat.bind(OmniEEService));
		this.scheduler.define(OMNI_JOB_NAME.AUTO_TRANSFER_UNANSWERED_CHAT, OmniEEService.autoTransferUnansweredChat.bind(OmniEEService));
		this.logger.debug(`Job definitions created for ${SCHEDULER_NAME}. Now creating indexes for ${SCHEDULER_NAME}`);
		await this.db.collection(SCHEDULER_NAME).createIndex(
			{
				'data.roomId': 1,
			},
			{ sparse: true },
		);
		this.logger.debug(`Indexes created for ${SCHEDULER_NAME}`);
	}

	async scheduleJobAt<T extends { roomId: IRoom['_id'] }>(name: OMNI_JOB_NAME, time: Date, data: T): Promise<Job> {
		const job = await this.scheduler.schedule(time, name, data);
		this.logger.debug(`Scheduled job: ${name} with data ${JSON.stringify(data)} at ${job.attrs.nextRunAt}`);
		return job;
	}

	async cancelJobByRoomId(name: OMNI_JOB_NAME, roomId: string): Promise<number> {
		const totalCancelledJobs = await this.scheduler.cancel({ roomId, name });
		this.logger.debug(`Cancelled ${totalCancelledJobs} jobs for ${name} with roomId ${roomId}`);
		return totalCancelledJobs;
	}
}
