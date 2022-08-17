import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import moment from 'moment';
import type { Job } from '@rocket.chat/agenda';
import type { CreateIndexesOptions, IndexSpecification } from 'mongodb';

import { Livechat } from '../../../../../app/livechat/server';
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

	getIndexesForDB(): { indexSpec: IndexSpecification; options?: CreateIndexesOptions | undefined }[] {
		return [
			{
				indexSpec: {
					'data.roomId': 1,
				},
				options: { sparse: true },
			},
		];
	}

	public static async getInstance(): Promise<AutoCloseOnHoldSchedulerClass> {
		if (!AutoCloseOnHoldSchedulerClass.instance) {
			AutoCloseOnHoldSchedulerClass.instance = new AutoCloseOnHoldSchedulerClass();
			await AutoCloseOnHoldSchedulerClass.instance.init();
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
		this.logger.debug(`Scheduling ${JOB_NAME} for room ${roomId}`);
		await this.unscheduleRoom(roomId);

		const when = moment(new Date()).add(timeout, 's').toDate();

		const job = await this.scheduler.schedule(when, JOB_NAME, { roomId, comment } as JobData);

		this.logger.debug(`Scheduled ${JOB_NAME} for room ${roomId} at ${job.attrs.nextRunAt}`);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		this.logger.debug(`Unscheduling ${JOB_NAME} for room ${roomId}`);

		const totalCancelledJobs = await this.scheduler.cancel({ data: { roomId } });

		this.logger.debug(`Unscheduled ${JOB_NAME} for room ${roomId} (${totalCancelledJobs} jobs cancelled)`);
	}

	private async executeJob(job: Job): Promise<void> {
		const data = job.attrs.data as JobData;

		this.logger.debug(`Executing ${JOB_NAME} for room ${data.roomId}`);

		const { roomId, comment } = data;

		const [room, user] = await Promise.all([LivechatRooms.findOneById(roomId), this.getSchedularUser()]);

		if (!room) {
			this.logger.error(`Could not find room ${roomId}`);
		}

		const payload = {
			user,
			room,
			comment,
			options: {},
			visitor: undefined,
		};

		Livechat.closeRoom(payload);

		this.logger.debug(`Executed ${JOB_NAME} for room ${roomId}`);
	}
}

export const AutoCloseOnHoldScheduler = AutoCloseOnHoldSchedulerClass.getInstance();
