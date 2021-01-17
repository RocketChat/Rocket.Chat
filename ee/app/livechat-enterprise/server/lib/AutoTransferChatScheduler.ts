import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { LivechatRooms, Users } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server';
import { settings } from '../../../../../app/settings/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';

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
		const when = new Date();
		when.setSeconds(when.getSeconds() + timeout);

		this.scheduler.define(jobName, this.executeJob);
		await this.scheduler.schedule(when, jobName, { roomId });
		await LivechatRooms.setAutoTransferOngoingById(roomId);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		const jobName = `livechat-auto-transfer-${ roomId }`;

		await LivechatRooms.unsetAutoTransferOngoingById(roomId);
		await this.scheduler.cancel({ name: jobName });
	}

	private async transferRoom({ attrs: { data } }: any = {}): Promise<boolean> {

		forwardRoomToAgent(room, transferData);
		if (!success) {
			return;
		}
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		Livechat.returnRoomAsInquiry(room._id, departmentId);
		return;
	}
	}

	private executeJob({ attrs: { data } }: any = {}): Promise<void> {
		const { roomId } = data;
		const schedulerUser: any = Users.findOneById('rocket.cat');

		try {
			const room = LivechatRooms.findOneById(roomId, { _id: 1, v: 1, servedBy: 1, open: 1, departmentId: 1 });
			if (!room?.servedBy?._id) {
				return;
			}

			const timeout = settings.get('Livechat_auto_transfer_chat_timeout');
			const { departmentId, servedBy: { _id: ignoreAgentId, username } } = room;

			const agent = await RoutingManager.getNextAgent(departmentId, ignoreAgentId);
			if (agent) {
				const transferData = {
					userId: agent.agentId,
					transferredBy: schedulerUser,
					transferredTo: agent,
					comment: TAPi18n.__('Livechat_auto_transfer_chat_message', { username, timeout }),
				};
			}

			await LivechatRooms.setAutoTransferredAtById(roomId);
			await this.unscheduleRoom(roomId);
		} catch (err) {
			console.error(err);
		}
	}
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();

Meteor.startup(() => {
	AutoTransferChatScheduler.init();
});
