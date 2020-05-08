import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { callbacks } from '../../app/callbacks/server';
import { Subscriptions } from '../../app/models/server';
import { NotificationQueue } from '../../app/models/server/raw';

Meteor.methods({
	readMessages(rid) {
		check(rid, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		callbacks.run('beforeReadMessages', rid, userId);

		// TODO: move this calls to an exported function
		const userSubscription = Subscriptions.findOneByRoomIdAndUserId(rid, userId, { fields: { ls: 1 } });

		if (!userSubscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'readMessages',
			});
		}

		Subscriptions.setAsReadByRoomIdAndUserId(rid, userId);

		NotificationQueue.clearQueueByUserId(userId);

		Meteor.defer(() => {
			callbacks.run('afterReadMessages', rid, { userId, lastSeen: userSubscription.ls });
		});
	},
});
