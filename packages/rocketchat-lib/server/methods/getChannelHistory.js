Meteor.methods({
	getChannelHistory(rid, latest, oldest, inclusive, count, unreads) {
		check(rid, String);
		console.log(arguments);

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
		if (!_.isUndefined(oldest)) {
			if (!_.isDate(oldest)) {
				throw new Meteor.Error('error-invalid-date', 'Invalid date', { method: 'getChannelHistory' });
			}
		}

		//Limit the count to 20 if it wasn't defined
		let limit = 20;
		if (!_.isUndefined(count)) {
			limit = count;
		}

		const options = {
			sort: {
				ts: -1
			},
			limit: limit
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

		const messages = _.map(records, (message) => {
			message.starred = _.findWhere(message.starred, { _id: fromUserId });
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
				messages,
				firstUnread,
				unreadNotLoaded
			};
		}

		return {
			messages
		};
	}
});
