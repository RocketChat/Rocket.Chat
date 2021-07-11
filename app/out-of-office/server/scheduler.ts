import { Meteor } from 'meteor/meteor';
import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';

import { OutOfOfficeUsers } from '../../models/server';
import { addToOutOfOfficeRoomsCollection, removeUserIdInPresentRooms } from './lib';

interface IScheduleEnable {
	userId: string;
	when: string;
	roomIds: string[];
}

interface IScheduleDisable {
	userId: string;
	when: string;
}

const EnableOutOfOfficeUserJob = 'enableOutOfOfficeUser';
const DisableOutOfOfficeUserJob = 'disableOutOfOfficeUser';

class OutOfOfficeScheduler {
	private isConnected: boolean;

	private scheduler: Agenda;

	constructor() {
		this.scheduler = new Agenda({
			mongo: (
				MongoInternals.defaultRemoteCollectionDriver().mongo as any
			).client.db(),
			db: { collection: 'outofoffice_scheduler' },
			defaultConcurrency: 1,
		});
		this.isConnected = false;
	}

	private async startScheduler(): Promise<void> {
		if (!this.isConnected) {
			await this.scheduler.start();
			this.isConnected = true;
		}
	}

	private async registerJobs(): Promise<void> {
		this.scheduler.define(
			EnableOutOfOfficeUserJob,
			async ({ attrs: { _id, data } }: Agenda.Job) => {
				const { userId, roomIds } = data;
				await this.scheduler.cancel({ _id });
				await addToOutOfOfficeRoomsCollection(userId, roomIds);
			},
		);
		this.scheduler.define(
			DisableOutOfOfficeUserJob,
			async ({ attrs: { _id, data } }: Agenda.Job) => {
				const { userId } = data;
				await this.scheduler.cancel({ _id });
				OutOfOfficeUsers.setDisabled(userId);
			},
		);
	}

	public async startup(): Promise<void> {
		await this.startScheduler();
		await this.registerJobs();
	}

	public async scheduleEnable({ when, userId, roomIds }: IScheduleEnable): Promise<void> {
		await this.startScheduler();
		const scheduledJobs = await this.scheduler.jobs({
			name: EnableOutOfOfficeUserJob,
			data: { userId },
		});
		if (scheduledJobs.length > 0) {
			await this.scheduler.cancel({ _id: scheduledJobs[0].attrs._id }); // reschedule the job for the user
		}
		// if the user has rescheduled the startDate, remove this userId in OutOfOfficeRooms
		await removeUserIdInPresentRooms(userId);

		await this.scheduler.schedule(when, EnableOutOfOfficeUserJob, { userId, roomIds });
	}

	public async scheduleDisable({
		when,
		userId,
	}: IScheduleDisable): Promise<void> {
		// const when = new Date(when);
		await this.startScheduler();
		const scheduledJobs = await this.scheduler.jobs({
			name: DisableOutOfOfficeUserJob,
			data: { userId },
		});
		if (scheduledJobs.length > 0) {
			await this.scheduler.cancel({ _id: scheduledJobs[0].attrs._id }); // reschedule the job for the user
		}
		await this.scheduler.schedule(when, DisableOutOfOfficeUserJob, {
			userId,
		});
	}

	public async cancelScheduledByUser(userId: string): Promise<void> {
		await this.scheduler.cancel({
			name: EnableOutOfOfficeUserJob,
			data: { userId },
		});
		await this.scheduler.cancel({
			name: DisableOutOfOfficeUserJob,
			data: { userId },
		});
	}
}

export const outOfOfficeScheduler = new OutOfOfficeScheduler();

Meteor.startup(() => {
	outOfOfficeScheduler.startup();
});
