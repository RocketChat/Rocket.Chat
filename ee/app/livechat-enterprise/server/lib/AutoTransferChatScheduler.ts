import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { LivechatRooms, Messages, Users } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server';
import { settings } from '../../../../../app/settings/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';

const schedulerUser = Users.findOneById('rocket.cat');
const JOB_NAME_PREFIX = 'omnichannel-auto-transfer-chat-';

class AutoTransferChatSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	user: {};

	public init(): void {
		if (this.running) {
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: 'omnichannel_scheduler' },
			// this ensures the same job doesn't get executed multiple times in a cluster
			defaultConcurrency: 1,
		});

		this.scheduler.start();
		this.running = true;
	}

	public async scheduleRoom(roomId: string, timeout: number): Promise<void> {
		await this.unscheduleRoom(roomId);

		const jobName = `${ JOB_NAME_PREFIX }${ roomId }`;
		const when = new Date();
		when.setSeconds(when.getSeconds() + timeout);

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId });
		await LivechatRooms.setAutoTransferOngoingById(roomId);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		const jobName = `${ JOB_NAME_PREFIX }${ roomId }`;

		await LivechatRooms.unsetAutoTransferOngoingById(roomId);
		await this.scheduler.cancel({ name: jobName });
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		const { roomId } = data;
		const room = LivechatRooms.findOneById(roomId, { _id: 1, v: 1, servedBy: 1, open: 1, departmentId: 1 });
		if (!room?.open || !room?.servedBy?._id) {
			return;
		}

		const { departmentId, servedBy: { _id: ignoreAgentId, username } } = room;
		let success;

		if (!RoutingManager.getConfig().autoAssignAgent) {
			success = Livechat.returnRoomAsInquiry(room._id, departmentId);
		} else {
			const transferredTo = await RoutingManager.getNextAgent(departmentId, ignoreAgentId);
			success = transferredTo && await forwardRoomToAgent(room, { userId: transferredTo.agentId, transferredBy: this.user, transferredTo });
		}

		if (success) {
			const timeout = settings.get('Livechat_auto_transfer_chat_timeout');
			Messages.createAutoTransferChatWithRoomIdMessageAndUser(roomId, TAPi18n.__('Livechat_auto_transfer_chat_message', { username, timeout }), schedulerUser);
			LivechatRooms.setAutoTransferredAtById(roomId);
		}

		await this.unscheduleRoom(roomId);
	}
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();

Meteor.startup(() => {
	AutoTransferChatScheduler.init();
});
