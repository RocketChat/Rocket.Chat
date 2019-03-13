import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { callbacks } from '/app/callbacks';
import { Subscriptions } from '/app/models';

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
		Subscriptions.setAsReadByRoomIdAndUserId(rid, userId);

		Meteor.defer(() => {
			callbacks.run('afterReadMessages', rid, { userId, lastSeen: userSubscription.ls });
		});
	},
});
