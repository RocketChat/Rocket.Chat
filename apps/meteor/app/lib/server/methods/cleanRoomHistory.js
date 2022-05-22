import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { cleanRoomHistory } from '../functions';

Meteor.methods({
	cleanRoomHistory({
		roomId,
		latest,
		oldest,
		inclusive = true,
		limit,
		excludePinned = false,
		ignoreDiscussion = true,
		filesOnly = false,
		fromUsers = [],
		ignoreThreads,
	}) {
		check(roomId, String);
		check(latest, Date);
		check(oldest, Date);
		check(inclusive, Boolean);
		check(limit, Match.Maybe(Number));
		check(excludePinned, Match.Maybe(Boolean));
		check(filesOnly, Match.Maybe(Boolean));
		check(ignoreThreads, Match.Maybe(Boolean));
		check(fromUsers, Match.Maybe([String]));

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanRoomHistory' });
		}

		if (!hasPermission(userId, 'clean-channel-history', roomId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'cleanRoomHistory' });
		}

		return cleanRoomHistory({
			rid: roomId,
			latest,
			oldest,
			inclusive,
			limit,
			excludePinned,
			ignoreDiscussion,
			filesOnly,
			fromUsers,
			ignoreThreads,
		});
	},
});
