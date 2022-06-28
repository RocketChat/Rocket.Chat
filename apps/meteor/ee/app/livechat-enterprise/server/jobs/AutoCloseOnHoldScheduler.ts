import { IUser } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import { Collection } from 'mongodb';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { Livechat } from '../../../../../app/livechat/server';
import { schedulerLogger } from '../lib/logger';
import { AbstractOmniSchedulerClass } from './AbstractOmniSchedulerClass';

const JOB_NAME = 'omnichannel_auto_close_on_hold_scheduler';

type JobData = {
	roomId: string;
	comment: string;
};

// singleton class
export class AutoCloseOnHoldScheduler extends AbstractOmniSchedulerClass {
	private static instance: AutoCloseOnHoldScheduler;

	schedulerUser: IUser;

	createJobDefinition(): void {
		this.scheduler.define<JobData>(JOB_NAME, this.executeJob.bind(this));
	}

	createIndexes(collection: Collection): void {
		collection.createIndex(
			{
				'data.roomId': 1,
			},
			{ unique: true },
		);
	}

	public static getInstance(): AutoCloseOnHoldScheduler {
		if (!AutoCloseOnHoldScheduler.instance) {
			AutoCloseOnHoldScheduler.instance = new AutoCloseOnHoldScheduler();
		}

		return AutoCloseOnHoldScheduler.instance;
	}

	public static initializeScheduler(): void {
		AutoCloseOnHoldScheduler.getInstance();
	}

	// cache for SchedulerUser variable
	async getSchedularUser(): Promise<IUser> {
		if (this.schedulerUser) {
			return this.schedulerUser;
		}
		const user = await Users.findOneById('rocket.cat');
		if (!user) {
			throw new Error(`Could not find scheduler user with id 'rocket.cat'`);
		}
		this.schedulerUser = user;
		return this.schedulerUser;
	}

	public async scheduleRoom(roomId: string, timeout: number, comment: string): Promise<void> {
		schedulerLogger.debug(`Scheduling ${JOB_NAME} for room ${roomId}`);
		await this.unscheduleRoom(roomId);

		const when = moment(new Date()).add(timeout, 's').toDate();

		const job = await this.scheduler.schedule<JobData>(when, JOB_NAME, { roomId, comment });

		schedulerLogger.debug(`Scheduled ${JOB_NAME} for room ${roomId} at ${job.attrs.nextRunAt}`);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		schedulerLogger.debug(`Unscheduling ${JOB_NAME} for room ${roomId}`);

		const totalCancelledJobs = await this.scheduler.cancel({ data: { roomId } });

		schedulerLogger.debug(`Unscheduled ${JOB_NAME} for room ${roomId} (${totalCancelledJobs} jobs cancelled)`);
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		schedulerLogger.debug(`Executing ${JOB_NAME} for room ${data.roomId}`);

		const { roomId, comment } = data;

		const [room, user] = await Promise.all([LivechatRooms.findOneById(roomId), this.getSchedularUser()]);

		if (!room) {
			schedulerLogger.error(`Could not find room ${roomId}`);
		}

		const payload = {
			user,
			room,
			comment,
			options: {},
			visitor: undefined,
		};

		Livechat.closeRoom(payload);

		schedulerLogger.debug(`Executed ${JOB_NAME} for room ${roomId}`);
	}
}

Meteor.startup(() => {
	AutoCloseOnHoldScheduler.initializeScheduler();
});
