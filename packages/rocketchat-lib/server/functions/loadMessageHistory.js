import { settings } from 'meteor/rocketchat:settings';
import { Messages } from 'meteor/rocketchat:models';
import { composeMessageObjectWithUser } from 'meteor/rocketchat:utils';

const hideMessagesOfType = [];

settings.get(/Message_HideType_.+/, function(key, value) {
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

export const loadMessageHistory = function loadMessageHistory({ userId, rid, end, limit = 20, ls }) {
	const options = {
		sort: {
			ts: -1,
		},
		limit,
	};

	if (!settings.get('Message_ShowEditedStatus')) {
		options.fields = {
			editedAt: 0,
		};
	}

	let records;
	if (end != null) {
		records = Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(rid, end, hideMessagesOfType, options).fetch();
	} else {
		records = Messages.findVisibleByRoomIdNotContainingTypes(rid, hideMessagesOfType, options).fetch();
	}
	const messages = records.map((record) => composeMessageObjectWithUser(record, userId));
	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls != null) {
		const firstMessage = messages[messages.length - 1];

		if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
			delete options.limit;

			const unreadMessages = Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(rid, ls, firstMessage.ts, hideMessagesOfType, {
				limit: 1,
				sort: {
					ts: 1,
				},
			});

			firstUnread = unreadMessages.fetch()[0];
			unreadNotLoaded = unreadMessages.count();
		}
	}

	return {
		messages,
		firstUnread,
		unreadNotLoaded,
	};
};
