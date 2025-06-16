import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Subscriptions, ReadReceipts } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteOldOTRMessages(roomId: IRoom['_id']): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteOldOTRMessages(roomId: IRoom['_id']): Promise<void> {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteOldOTRMessages',
			});
		}

		const now = new Date();
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, userId);
		if (subscription?.t !== 'd') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'deleteOldOTRMessages',
			});
		}

		await Messages.deleteOldOTRMessages(roomId, now);
		await ReadReceipts.removeOTRReceiptsUntilDate(roomId, now);
	},
});
