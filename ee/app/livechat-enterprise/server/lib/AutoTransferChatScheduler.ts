import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { Users } from '../../../../../app/models/server';
import { autoTransferToNewAgent } from './Helper';


class AutoTransferChatSchedulerClass {
	scheduler: Agenda;

	userToPerformAutomaticTransfer: any;

	public init(): void {
		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: 'livechat_scheduler' },
			// this ensures the same job doesn't get executed multiple times in a cluster
			defaultConcurrency: 1,
		});
		this.userToPerformAutomaticTransfer = Users.findOneById('rocket.cat');
		this.scheduler.start();
	}

	public async scheduleRoom(roomId: string, timeout: number): Promise<void> {
		const jobName = `livechat-auto-transfer-${ roomId }`;
		const when = this.addMinutesToDate(new Date(), timeout);

		this.scheduler.define(jobName, this.autoTransferVisitorJob);

		await this.scheduler.schedule(when, jobName, { roomId, transferredBy: this.userToPerformAutomaticTransfer });
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		const jobName = `livechat-auto-transfer-${ roomId }`;

		await this.scheduler.cancel({ name: jobName });
	}

	private async autoTransferVisitorJob({ attrs: { data } }: any = {}): Promise<void> {
		const { roomId, transferredBy } = data;
		try {
			await autoTransferToNewAgent(roomId, transferredBy);
		} catch (err) {
			console.error(err);
		}
	}

	private addMinutesToDate(date: Date, minutes: number): Date {
		return new Date(date.getTime() + minutes * 1000 * 60);
	}
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();

Meteor.startup(() => {
	AutoTransferChatScheduler.init();
});
