import _ from 'underscore';

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

		if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadHistory'
			});
		}

		const fromId = Meteor.userId();
		const room = Meteor.call('canAccessRoom', rid, fromId);

		if (!room) {
			return false;
		}

		const canAnonymous = RocketChat.settings.get('Accounts_AllowAnonymousRead');
		const canPreview = RocketChat.authz.hasPermission(fromId, 'preview-c-room');
		if (room.t === 'c' && !canAnonymous && !canPreview && room.usernames.indexOf(room.username) === -1) {
			return false;
		}

		const options = {
			sort: {
				ts: -1
			},
			limit
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

		const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;

		const messages = records.map((message) => {
			message.starred = _.findWhere(message.starred, {
				_id: fromId
			});
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

		let unreadNotLoaded = 0;
		let firstUnread;

		if (ls != null) {
			const firstMessage = messages[messages.length - 1];

			if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
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
			messages,
			firstUnread,
			unreadNotLoaded
		};
	}
});
