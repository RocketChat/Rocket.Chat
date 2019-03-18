import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { hasPermission } from '../../../authorization';
import { metrics } from '../../../metrics';
import { settings } from '../../../settings';
import { Notifications } from '../../../notifications';
import { messageProperties } from '../../../ui-utils';
import { Subscriptions, Users } from '../../../models';
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

		if (message.msg) {
			const adjustedMessage = messageProperties.messageWithoutEmojiShortnames(message.msg);

			if (messageProperties.length(adjustedMessage) > settings.get('Message_MaxAllowedSize')) {
				throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
					method: 'sendMessage',
				});
			}
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

		const subscription = Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId());
		if (subscription && (subscription.blocked || subscription.blocker)) {
			Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: room._id,
				ts: new Date,
				msg: TAPi18n.__('room_is_blocked', {}, user.language),
			});
			throw new Meteor.Error('You can\'t send messages because you are blocked');
		}

		if (room.ro === true) {
			if (!hasPermission(Meteor.userId(), 'post-readonly', room._id)) {
				// Unless the user was manually unmuted
				if (!(room.unmuted || []).includes(user.username)) {
					Notifications.notifyUser(Meteor.userId(), 'message', {
						_id: Random.id(),
						rid: room._id,
						ts: new Date,
						msg: TAPi18n.__('room_is_read_only', {}, user.language),
					});

					throw new Meteor.Error('You can\'t send messages because the room is readonly.');
				}
			}
		}

		if ((room.muted || []).includes(user.username)) {
			Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: room._id,
				ts: new Date,
				msg: TAPi18n.__('You_have_been_muted', {}, user.language),
			});

			throw new Meteor.Error('You can\'t send messages because you have been muted');
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
