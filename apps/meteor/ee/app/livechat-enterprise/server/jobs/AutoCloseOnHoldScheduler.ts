import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import type { Collection } from 'mongodb';
import moment from 'moment';
import type { Job } from '@rocket.chat/agenda';

import { Livechat } from '../../../../../app/livechat/server';
import { schedulerLogger } from '../lib/logger';
import { AbstractOmniSchedulerClass } from './AbstractOmniSchedulerClass';

const JOB_NAME = 'omnichannel_auto_close_on_hold_scheduler';

type JobData = {
	roomId: IRoom['_id'];
	comment: string;
};

// singleton class
export class AutoCloseOnHoldSchedulerClass extends AbstractOmniSchedulerClass {
	private static instance: AutoCloseOnHoldSchedulerClass;

	schedulerUser: IUser;

	createJobDefinition(): void {
		this.scheduler.define(JOB_NAME, this.executeJob.bind(this));
	}

	createIndexes(collection: Collection): void {
		collection.createIndex(
			{
				'data.roomId': 1,
			},
			{ sparse: true },
		);
	}

	public static getInstance(): AutoCloseOnHoldSchedulerClass {
		if (!AutoCloseOnHoldSchedulerClass.instance) {
			AutoCloseOnHoldSchedulerClass.instance = new AutoCloseOnHoldSchedulerClass();
		}

		return AutoCloseOnHoldSchedulerClass.instance;
	}

	public static initializeScheduler(): void {
		AutoCloseOnHoldSchedulerClass.getInstance();
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

		const job = await this.scheduler.schedule(when, JOB_NAME, { roomId, comment } as JobData);

		schedulerLogger.debug(`Scheduled ${JOB_NAME} for room ${roomId} at ${job.attrs.nextRunAt}`);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		schedulerLogger.debug(`Unscheduling ${JOB_NAME} for room ${roomId}`);

		const totalCancelledJobs = await this.scheduler.cancel({ data: { roomId } });

		schedulerLogger.debug(`Unscheduled ${JOB_NAME} for room ${roomId} (${totalCancelledJobs} jobs cancelled)`);
	}

	private async executeJob(job: Job): Promise<void> {
		const data = job.attrs.data as JobData;

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

export const AutoCloseOnHoldScheduler = AutoCloseOnHoldSchedulerClass.getInstance();
