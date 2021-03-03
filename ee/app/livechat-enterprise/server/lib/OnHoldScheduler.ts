import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { LivechatRooms } from '../../../../../app/models/server';

const SCHEDULER_NAME = 'omnichannel_manual_on_hold_scheduler';

class OnHoldSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	user: {};

	public init(): void {
		console.log('----staring OnHoldSchedulerClass');
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
		const when = new Date();
		when.setSeconds(when.getSeconds() + timeout);

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId });
	}


	public async unscheduleRoom(roomId: string): Promise<void> {
		const jobName = `${ SCHEDULER_NAME }-${ roomId }`;

		await (LivechatRooms as any).unsetCanPlaceOnHold(roomId);

		await this.scheduler.cancel({ name: jobName });
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		console.log('---executeJob called', data);

		const { roomId } = data;

		const result = await (LivechatRooms as any).setCanPlaceOnHold(roomId);
		console.log('---result', result);
	}
}

export const OnHoldChatScheduler = new OnHoldSchedulerClass();

Meteor.startup(() => {
	console.log('---from meteor startup - OnHoldChatScheduler');
	// OnHoldChatScheduler.init();
});
