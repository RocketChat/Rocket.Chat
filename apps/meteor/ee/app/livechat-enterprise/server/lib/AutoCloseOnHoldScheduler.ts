import { Agenda } from '@rocket.chat/agenda';
import type { IUser } from '@rocket.chat/core-typings';
import type { MainLogger } from '@rocket.chat/logger';
import { LivechatRooms, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import moment from 'moment';

import { schedulerLogger } from './logger';
import { closeRoom } from '../../../../../app/livechat/server/lib/closeRoom';

const SCHEDULER_NAME = 'omnichannel_auto_close_on_hold_scheduler';

export class AutoCloseOnHoldSchedulerClass {
	scheduler: Agenda;

	schedulerUser: IUser;

	running: boolean;

	logger: MainLogger;

	constructor() {
		this.logger = schedulerLogger.section('AutoCloseOnHoldScheduler');
	}

	public async init(): Promise<void> {
		if (this.running) {
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
			processEvery: process.env.TEST_MODE === 'true' ? '3 seconds' : '1 minute',
		});

		await this.scheduler.start();
		this.running = true;
		this.logger.info('Service started');
	}

	public async scheduleRoom(roomId: string, timeout: number, comment: string): Promise<void> {
		if (!this.running) {
			throw new Error('AutoCloseOnHoldScheduler is not running');
		}

		this.logger.debug(`Scheduling room ${roomId} to be closed in ${timeout} seconds`);
		await this.unscheduleRoom(roomId);

		const jobName = `${SCHEDULER_NAME}-${roomId}`;
		const when = moment(new Date()).add(timeout, 's').toDate();

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId, comment });
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		if (!this.running) {
			throw new Error('AutoCloseOnHoldScheduler is not running');
		}
		this.logger.debug(`Unscheduling room ${roomId}`);
		const jobName = `${SCHEDULER_NAME}-${roomId}`;
		await this.scheduler.cancel({ name: jobName });
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		this.logger.debug(`Executing job for room ${data.roomId}`);
		const { roomId, comment } = data;

		const [room, user] = await Promise.all([LivechatRooms.findOneById(roomId), this.getSchedulerUser()]);
		if (!room || !user) {
			throw new Error(
				`Unable to process AutoCloseOnHoldScheduler job because room or user not found for roomId: ${roomId} and userId: rocket.cat`,
			);
		}

		const payload = {
			room,
			user,
			comment,
		};

		await closeRoom(payload);
	}

	private async getSchedulerUser(): Promise<IUser> {
		if (!this.schedulerUser) {
			const schedulerUser = await Users.findOneById('rocket.cat');
			if (!schedulerUser) {
				throw new Error('Scheduler user not found');
			}
			this.schedulerUser = schedulerUser;
		}

		return this.schedulerUser;
	}
}

export const AutoCloseOnHoldScheduler = new AutoCloseOnHoldSchedulerClass();

Meteor.startup(() => {
	void AutoCloseOnHoldScheduler.init();
});
