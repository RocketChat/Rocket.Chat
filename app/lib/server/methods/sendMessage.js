import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from '/app/authorization';
import { metrics } from '/app/metrics';
import { settings } from '/app/settings';
import { Users } from '/app/models';
import { sendMessage } from '../functions';
import { RateLimiter } from '../lib';
import moment from 'moment';

Meteor.methods({
	sendMessage(message) {
		check(message, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendMessage',
			});
		}

		if (!message.rid) {
			throw new Error('The \'rid\' property on the message object is missing.');
		}

		if (message.ts) {
			const tsDiff = Math.abs(moment(message.ts).diff());
			if (tsDiff > 60000) {
				throw new Meteor.Error('error-message-ts-out-of-sync', 'Message timestamp is out of sync', {
					method: 'sendMessage',
					message_ts: message.ts,
					server_ts: new Date().getTime(),
				});
			} else if (tsDiff > 10000) {
				message.ts = new Date();
			}
		} else {
			message.ts = new Date();
		}

		const user = Users.findOneById(Meteor.userId(), {
			fields: {
				username: 1,
				name: 1,
			},
		});

		const room = Meteor.call('canAccessRoom', message.rid, user._id);
		if (!room) {
			return false;
		}

		if (message.alias == null && settings.get('Message_SetNameToAliasEnabled')) {
			message.alias = user.name;
		}

		if (Meteor.settings.public.sandstorm) {
			message.sandstormSessionId = this.connection.sandstormSessionId();
		}

		metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736
		return sendMessage(user, message, room);
	},
});
// Limit a user, who does not have the "bot" role, to sending 5 msgs/second
RateLimiter.limitMethod('sendMessage', 5, 1000, {
	userId(userId) {
		return !hasPermission(userId, 'send-many-messages');
	},
});
