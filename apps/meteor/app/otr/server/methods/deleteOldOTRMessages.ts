import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { Messages } from '@rocket.chat/models';

import { Subscriptions } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteOldOTRMessages(roomId: IRoom['_id']): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteOldOTRMessages(roomId: IRoom['_id']): Promise<void> {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteOldOTRMessages',
			});
		}

		const now = new Date();
		const subscription: ISubscription = Subscriptions.findOneByRoomIdAndUserId(roomId, Meteor.userId());
		if (subscription?.t !== 'd') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'deleteOldOTRMessages',
			});
		}

		await Messages.deleteOldOTRMessages(roomId, now);
	},
});
