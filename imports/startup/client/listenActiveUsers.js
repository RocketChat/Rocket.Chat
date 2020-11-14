import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { Notifications } from '../../../app/notifications/client';
import { Presence } from '../../../client/lib/presence';

// mirror of object in /imports/users-presence/server/activeUsers.js - keep updated
const STATUS_MAP = [
	'offline',
	'online',
	'away',
	'busy',
];

export const interestedUserIds = new Set();

export const saveUser = (user, force = false) => {
	// do not update my own user, my user's status will come from a subscription
	if (user._id === Accounts.connection?._userId) {
		return;
	}

	const found = Meteor.users._collection._docs._map[user._id];

	if (found && force) {
		return Meteor.users.update({ _id: user._id }, {
			$set: {
				username: user.username,
				// name: user.name,
				// utcOffset: user.utcOffset,
				status: user.status,
				statusText: user.statusText,
				...user.avatarETag && { avatarETag: user.avatarETag },
			},
		});
	}

	if (!found) {
		Meteor.users.insert(user);
	}
};

Meteor.startup(function() {
	Notifications.onLogged('user-status', ([_id, username, status, statusText]) => {
		Presence.notify({
			_id,
			username,
			status: STATUS_MAP[status],
			statusText,
		});
		if (!interestedUserIds.has(_id)) {
			return;
		}

		saveUser({ _id, username, status: STATUS_MAP[status], statusText }, true);
	});
});
