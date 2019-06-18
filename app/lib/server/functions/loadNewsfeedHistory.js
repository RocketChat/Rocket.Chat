import { settings } from '../../../settings';
import { Rooms, Users, Messages } from '../../../models';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';


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

export const loadNewsfeedHistory = function loadNewsfeedHistory({ userId, end, limit = 20, ls }) {
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
	let followingObject = {};
	let following = [];
	if ('following' in Users.findOneById(userId)) {
		followingObject = Users.findOneById(userId).following;
	}
	if (Object.keys(followingObject).length === 0 && followingObject.constructor === Object) {
		return {};
	}


	following = Object.keys(followingObject).map(function(key) {
		return { 'u._id': key };
	});


	let records;
	if (end != null) {
		records = Messages.findVisibleByFollowingBeforeTimestampNotContainingTypes(following, end, hideMessagesOfType, options).fetch();
	} else {
		records = Messages.findVisibleByFollowingNotContainingTypes(following, hideMessagesOfType, options).fetch();
	}
	const messages = normalizeMessagesForUser(records, userId);
	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls != null) {
		const firstMessage = messages[messages.length - 1];

		if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
			delete options.limit;

			const unreadMessages = Messages.findVisibleByFollowingBetweenTimestampsNotContainingTypes(following, ls, firstMessage.ts, hideMessagesOfType, {
				limit: 1,
				sort: {
					ts: 1,
				},
			});

			firstUnread = unreadMessages.fetch()[0];
			unreadNotLoaded = unreadMessages.count();
		}
	}

	messages.forEach((msg) => {
		msg.originalRoomNameForNewsfeed = Rooms.findById(msg.rid).fetch()[0].name;
	});
	return {
		messages,
		firstUnread,
		unreadNotLoaded,
	};
};
