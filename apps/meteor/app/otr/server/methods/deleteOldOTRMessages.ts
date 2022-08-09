import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Subscriptions, Messages } from '../../../models/server';

Meteor.methods({
	deleteOldOTRMessages(roomId: IRoom['_id']): void {
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

		Messages.deleteOldOTRMessages(roomId, now);
	},
});
