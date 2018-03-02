import moment from 'moment';

Meteor.methods({
	sendMessage(message) {
		check(message, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendMessage'
			});
		}

		if (!message.rid) {
			throw new Error('The \'rid\' param, must be provided');
		}

		if (message.ts) {
			const tsDiff = Math.abs(moment(message.ts).diff());
			if (tsDiff > 60000) {
				throw new Meteor.Error('error-message-ts-out-of-sync', 'Message timestamp is out of sync', {
					method: 'sendMessage',
					message_ts: message.ts,
					server_ts: new Date().getTime()
				});
			} else if (tsDiff > 10000) {
				message.ts = new Date();
			}
		} else {
			message.ts = new Date();
		}

		if (message.msg && message.msg.length > RocketChat.settings.get('Message_MaxAllowedSize')) {
			throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
				method: 'sendMessage'
			});
		}

		const user = RocketChat.models.Users.findOneById(Meteor.userId(), {
			fields: {
				username: 1,
				name: 1
			}
		});

		const room = Meteor.call('canAccessRoom', message.rid, user._id);
		if (!room) {
			return false;
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId());
		if (subscription && subscription.blocked || subscription.blocker) {
			RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: room._id,
				ts: new Date,
				msg: TAPi18n.__('room_is_blocked', {}, user.language)
			});
			return false;
		}

		if ((room.muted || []).includes(user.username)) {
			RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: room._id,
				ts: new Date,
				msg: TAPi18n.__('You_have_been_muted', {}, user.language)
			});
			return false;
		}

		if (message.alias == null && RocketChat.settings.get('Message_SetNameToAliasEnabled')) {
			message.alias = user.name;
		}

		if (Meteor.settings['public'].sandstorm) {
			message.sandstormSessionId = this.connection.sandstormSessionId();
		}

		RocketChat.metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736
		return RocketChat.sendMessage(user, message, room);
	}
});
// Limit a user, who does not have the "bot" role, to sending 5 msgs/second
RocketChat.RateLimiter.limitMethod('sendMessage', 5, 1000, {
	userId(userId) {
		return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
	}
});
