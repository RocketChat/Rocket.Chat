import _ from 'underscore';

Meteor.methods({
	getChannelHistory({rid, latest, oldest, inclusive, count = 20, unreads}) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getChannelHistory' });
		}

		const fromUserId = Meteor.userId();
		const room = Meteor.call('canAccessRoom', rid, fromUserId);
		if (!room) {
			return false;
		}

		//Make sure they can access the room
		if (room.t === 'c' && !RocketChat.authz.hasPermission(fromUserId, 'preview-c-room') && room.usernames.indexOf(room.username) === -1) {
			return false;
		}

		//Ensure latest is always defined.
		if (_.isUndefined(latest)) {
			latest = new Date();
		}

		//Verify oldest is a date if it exists
		if (!_.isUndefined(oldest) && !_.isDate(oldest)) {
			throw new Meteor.Error('error-invalid-date', 'Invalid date', { method: 'getChannelHistory' });
		}

		const options = {
			sort: {
				ts: -1
			},
			limit: count
		};

		if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
			options.fields = { 'editedAt': 0 };
		}

		let records = [];
		if (_.isUndefined(oldest) && inclusive) {
			records = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestampInclusive(rid, latest, options).fetch();
		} else if (_.isUndefined(oldest) && !inclusive) {
			records = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestamp(rid, latest, options).fetch();
		} else if (!_.isUndefined(oldest) && inclusive) {
			records = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestampsInclusive(rid, oldest, latest, options).fetch();
		} else {
			records = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestamps(rid, oldest, latest, options).fetch();
		}

		const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;

		const messages = _.map(records, (message) => {
			message.starred = _.findWhere(message.starred, { _id: fromUserId });
			if (message.u && message.u._id && UI_Use_Real_Name) {
				const user = RocketChat.models.Users.findOneById(message.u._id);
				message.u.name = user && user.name;
			}
			if (message.mentions && message.mentions.length && UI_Use_Real_Name) {
				message.mentions.forEach((mention) => {
					const user = RocketChat.models.Users.findOneById(mention._id);
					mention.name = user && user.name;
				});
			}
			return message;
		});

		if (unreads) {
			let unreadNotLoaded = 0;
			let firstUnread = undefined;

			if (!_.isUndefined(oldest)) {
				const firstMsg = messages[messages.length - 1];
				if (!_.isUndefined(firstMsg) && firstMsg.ts > oldest) {
					const unreadMessages = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestamps(rid, oldest, firstMsg.ts, { limit: 1, sort: { ts: 1 } });
					firstUnread = unreadMessages.fetch()[0];
					unreadNotLoaded = unreadMessages.count();
				}
			}

			return {
				messages: messages || [],
				firstUnread,
				unreadNotLoaded
			};
		}

		return {
			messages: messages || []
		};
	}
});
