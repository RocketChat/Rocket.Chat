import { settings } from '../../../settings';
import { Messages, UserRelations } from '../../../models';
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

	const following2 = UserRelations.find({ follower: userId }, { fields: { following: 1, _id: false } }).fetch();


	if (following2.length === 0) {
		return {};
	}
	const following = [];
	following2.forEach((fObject) => {
		delete Object.assign(fObject, { 'u._id': fObject.following }).following;
		following.push(fObject);
	});


	let records;
	if (end != null) {
		records = Messages.findVisibleByFollowingBeforeTimestampNotContainingTypes(userId, following, end, hideMessagesOfType, options).fetch();
	} else {
		records = Messages.findVisibleByFollowingNotContainingTypes(userId, following, hideMessagesOfType, options).fetch();
	}
	const messages = normalizeMessagesForUser(records, userId);
	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls != null) {
		const firstMessage = messages[messages.length - 1];

		if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
			delete options.limit;

			const unreadMessages = Messages.findVisibleByFollowingBetweenTimestampsNotContainingTypes(userId, following, ls, firstMessage.ts, hideMessagesOfType, {
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
