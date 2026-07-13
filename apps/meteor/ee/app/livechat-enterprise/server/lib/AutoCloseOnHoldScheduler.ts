import type { IUser } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import type { MainLogger } from '@rocket.chat/logger';
import { LivechatRooms, Users } from '@rocket.chat/models';

import { schedulerLogger } from './logger';
import { closeRoom } from '../../../../../app/livechat/server/lib/closeRoom';

const SCHEDULER_NAME = 'omnichannel_auto_close_on_hold_scheduler';

export class AutoCloseOnHoldSchedulerClass {
	schedulerUser: IUser;

	logger: MainLogger;

	constructor() {
		this.logger = schedulerLogger.section('AutoCloseOnHoldScheduler');
	}

	public async scheduleRoom(roomId: string, timeout: number, comment: string): Promise<void> {
		this.logger.debug({ msg: 'Scheduling room to be closed', roomId, timeoutSeconds: timeout });
		await this.unscheduleRoom(roomId);

		const when = new Date(Date.now() + timeout * 1000);
		await cronJobs.addAtTimestamp(`${SCHEDULER_NAME}-${roomId}`, when, () => this.executeJob(roomId, comment));
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		this.logger.debug({ msg: 'Unscheduling room', roomId });
		await cronJobs.remove(`${SCHEDULER_NAME}-${roomId}`);
	}

	private async executeJob(roomId: string, comment: string): Promise<void> {
		this.logger.debug({ msg: 'Executing job for room', roomId });

		const [room, user] = await Promise.all([LivechatRooms.findOneById(roomId), this.getSchedulerUser()]);
		if (!room || !user) {
			throw new Error(
				`Unable to process AutoCloseOnHoldScheduler job because room or user not found for roomId: ${roomId} and userId: rocket.cat`,
			);
		}

		await closeRoom({ room, user, comment });
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
