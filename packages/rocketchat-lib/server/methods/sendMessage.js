import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	async sendMessage(message) {
		check(message, Object);
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendMessage',
			});
		}

		if (!message.rid) {
			throw new Error('The \'rid\' property on the message object is missing.');
		}

		return RocketChat.Services.call('chat.sendMessage', { uid, message });
	},
});
// Limit a user, who does not have the "bot" role, to sending 5 msgs/second
RocketChat.RateLimiter.limitMethod('sendMessage', 5, 1000, {
	userId(userId) {
		return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
	},
});
