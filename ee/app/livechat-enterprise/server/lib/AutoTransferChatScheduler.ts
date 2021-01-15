import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { LivechatRooms, LivechatVisitors, Users } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server';
import { settings } from '../../../../../app/settings/server';


class AutoTransferChatSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	public init(): void {
		if (this.running) {
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: 'livechat_scheduler' },
			// this ensures the same job doesn't get executed multiple times in a cluster
			defaultConcurrency: 1,
		});
		this.scheduler.start();
		this.running = true;
	}

	public async scheduleRoom(roomId: string, timeout: number): Promise<void> {
		await this.unscheduleRoom(roomId);

		const jobName = `livechat-auto-transfer-${ roomId }`;
		const when = this.addSecondsToDate(new Date(), timeout);

		this.scheduler.define(jobName, this.autoTransferVisitorJob);

		await this.scheduler.schedule(when, jobName, { roomId });
		await LivechatRooms.setAutoTransferOngoingById(roomId);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		const jobName = `livechat-auto-transfer-${ roomId }`;

		await LivechatRooms.unsetAutoTransferOngoingById(roomId);
		await this.scheduler.cancel({ name: jobName });
	}

	private async autoTransferVisitorJob({ attrs: { data } }: any = {}): Promise<void> {
		const { roomId } = data;
		const schedulerUser: any = Users.findOneById('rocket.cat');

		try {
			const room = await LivechatRooms.findOneById(roomId, { _id: 1, v: 1, servedBy: 1, open: 1, departmentId: 1 });
			const timeout = await settings.get('Livechat_auto_transfer_chat_timeout');
			const { departmentId, v: { token }, servedBy: { _id: ignoreAgentId, username } = { _id: null, username: null } } = room;

			const guest = await LivechatVisitors.getVisitorByToken(token, {});
			const transferData = {
				ignoreAgentId,
				departmentId,
				transferredBy: schedulerUser,
				comment: TAPi18n.__('Livechat_auto_transfer_chat_message', { username, timeout }),
			};

			await Livechat.transfer(room, guest, transferData);
			await LivechatRooms.setAutoTransferredAtById(roomId);
			await this.unscheduleRoom(roomId);
		} catch (err) {
			console.error(err);
		}
	}

	private addSecondsToDate(date: Date, seconds: number): Date {
		return new Date(date.getTime() + seconds * 1000);
	}
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();

Meteor.startup(() => {
	AutoTransferChatScheduler.init();
});
