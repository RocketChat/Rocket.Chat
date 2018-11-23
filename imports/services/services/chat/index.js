import { Meteor } from 'meteor/meteor';
import moment from 'moment';
export default {
	name: 'chat',
	actions: {
		async sendMessage(ctx) {
			const { uid, message } = ctx;

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
				const adjustedMessage = RocketChat.messageProperties.messageWithoutEmojiShortnames(message.msg);

				if (RocketChat.messageProperties.length(adjustedMessage) > RocketChat.settings.get('Message_MaxAllowedSize')) {
					throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
						method: 'sendMessage',
					});
				}
			}

			const user = RocketChat.models.Users.findOneById(uid, {
				fields: {
					username: 1,
					name: 1,
				},
			});

			const room = await RocketChat.Services.call('authorization.canAccessRoom', { rid: message.rid, uid: user._id });
			if (!room) {
				return false;
			}

			const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, uid);

			if (subscription && (subscription.blocked || subscription.blocker)) {
				// RocketChat.Notifications.notifyUser(uid, 'message', {
				// 	_id: Random.id(),
				// 	rid: room._id,
				// 	ts: new Date,
				// 	msg: TAPi18n.__('room_is_blocked', {}, user.language),
				// });
				throw new Meteor.Error('You can\'t send messages because you are blocked');
			}

			if ((room.muted || []).includes(user.username)) {
				// RocketChat.Notifications.notifyUser(uid, 'message', {
				// 	_id: Random.id(),
				// 	rid: room._id,
				// 	ts: new Date,
				// 	msg: TAPi18n.__('You_have_been_muted', {}, user.language),
				// });
				throw new Meteor.Error('You can\'t send messages because you have been muted');
			}

			if (message.alias == null && RocketChat.settings.get('Message_SetNameToAliasEnabled')) {
				message.alias = user.name;
			}

			// if (Meteor.settings.public.sandstorm) {
			// 	message.sandstormSessionId = this.connection.sandstormSessionId();
			// }

			RocketChat.metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736
			return RocketChat.sendMessage(user, message, room);
		},
	},
};
