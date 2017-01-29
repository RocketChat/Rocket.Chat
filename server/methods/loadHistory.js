const hideMessagesOfType = [];

RocketChat.settings.get(/Message_HideType_.+/, function(key, value) {
	const type = key.replace('Message_HideType_', '');
	const types = type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type];

	return types.forEach((type) => {
		const index = hideMessagesOfType.indexOf(type);

		if (value === true && index === -1) {
			return hideMessagesOfType.push(type);
		}

		if (index > -1) {
			return hideMessagesOfType.splice(index, 1);
		}
	});
});

Meteor.methods({
	loadHistory(rid, end, limit = 20, ls) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadHistory'
			});
		}

		const fromId = Meteor.userId();
		const room = Meteor.call('canAccessRoom', rid, fromId);

		if (!room) {
			return false;
		}

		if (room.t === 'c' && !RocketChat.authz.hasPermission(fromId, 'preview-c-room') && room.usernames.indexOf(room.username) === -1) {
			return false;
		}

		const options = {
			sort: {
				ts: -1
			},
			limit: limit
		};

		if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
			options.fields = {
				editedAt: 0
			};
		}

		let records;
		if (end != null) {
			records = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(rid, end, hideMessagesOfType, options).fetch();
		} else {
			records = RocketChat.models.Messages.findVisibleByRoomIdNotContainingTypes(rid, hideMessagesOfType, options).fetch();
		}

		const messages = records.map((message) => {
			message.starred = _.findWhere(message.starred, {
				_id: fromId
			});
			return message;
		});

		let unreadNotLoaded = 0;
		let firstUnread;

		if (ls != null) {
			const firstMessage = messages[messages.length - 1];

			if ((firstMessage != null ? firstMessage.ts : void 0) > ls) {
				delete options.limit;

				const unreadMessages = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(rid, ls, firstMessage.ts, hideMessagesOfType, {
					limit: 1,
					sort: {
						ts: 1
					}
				});

				firstUnread = unreadMessages.fetch()[0];
				unreadNotLoaded = unreadMessages.count();
			}
		}

		return {
			messages: messages,
			firstUnread: firstUnread,
			unreadNotLoaded: unreadNotLoaded
		};
	}
});
