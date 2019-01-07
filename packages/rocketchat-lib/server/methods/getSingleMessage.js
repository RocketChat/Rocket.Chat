import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	getSingleMessage(msgId) {
		check(msgId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getSingleMessage' });
		}

		const msg = RocketChat.models.Messages.findOneById(msgId);

		if (!msg || !msg.rid) {
			return undefined;
		}

		if (!Meteor.call('canAccessRoom', msg.rid, Meteor.userId())) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msg;
	},
});
