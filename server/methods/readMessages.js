import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	readMessages(rid) {
		check(rid, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		RocketChat.callbacks.run('beforeReadMessages', rid, userId);

		RocketChat.readMessages(rid, userId);

		Meteor.defer(() => {
			RocketChat.callbacks.run('afterReadMessages', rid, userId);
		});
	},
});
