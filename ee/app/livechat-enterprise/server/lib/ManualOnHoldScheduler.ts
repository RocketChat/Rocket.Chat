import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { LivechatRooms } from '../../../../../app/models/server';

const SCHEDULER_NAME = 'omnichannel_manual_on_hold_scheduler';

class ManualOnHoldSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	user: {};

	public init(): void {
		if (this.running) {
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});

		this.scheduler.start();
		this.running = true;
	}

	public async scheduleRoom(roomId: string, timeout: number): Promise<void> {
		await this.unscheduleRoom(roomId);

		const jobName = `${ SCHEDULER_NAME }-${ roomId }`;
		const when = moment(new Date()).add(timeout, 's').toDate();

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId });
	}


	public async unscheduleRoom(roomId: string): Promise<void> {
		const jobName = `${ SCHEDULER_NAME }-${ roomId }`;

		await (LivechatRooms as any).unsetCanPlaceOnHold(roomId);

		await this.scheduler.cancel({ name: jobName });
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		const { roomId } = data;

		await (LivechatRooms as any).setCanPlaceOnHold(roomId);
	}
}

export const ManualOnHoldChatScheduler = new ManualOnHoldSchedulerClass();

Meteor.startup(() => {
	ManualOnHoldChatScheduler.init();
});
