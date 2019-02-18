import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { Subscriptions } from 'meteor/rocketchat:models';

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

		// TODO: move this call to an exported function
		Subscriptions.setAsReadByRoomIdAndUserId(rid, userId);

		Meteor.defer(() => {
			callbacks.run('afterReadMessages', rid, userId);
		});
	},
});
