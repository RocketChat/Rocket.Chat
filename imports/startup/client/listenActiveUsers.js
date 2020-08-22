import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
// import { debounce } from 'underscore';

import { Notifications } from '../../../app/notifications/client';
// import { APIClient } from '../../../app/utils/client';

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

// let lastStatusChange = null;
// let retry = 0;
// const getUsersPresence = debounce(async (isConnected) => {
// 	try {
// 		const params = {};

// 		if (lastStatusChange) {
// 			params.from = lastStatusChange.toISOString();
// 		}

// 		const {
// 			users,
// 			full,
// 		} = await APIClient.v1.get('users.presence', params);

// 		// if is reconnecting, set everyone else to offline
// 		if (full && isConnected) {
// 			Meteor.users.update({
// 				_id: { $ne: Meteor.userId() },
// 			}, {
// 				$set: {
// 					status: 'offline',
// 				},
// 			}, { multi: true });
// 		}

// 		users.forEach((user) => saveUser(user, full));

// 		lastStatusChange = new Date();
// 	} catch (e) {
// 		setTimeout(() => getUsersPresence(isConnected), retry++ * 2000);
// 	}
// }, 1000);

Meteor.startup(function() {
	Notifications.onLogged('user-status', ([_id, username, status, statusText]) => {
		if (!interestedUserIds.has(_id)) {
			return;
		}

		// only set after first request completed
		// if (lastStatusChange) {
		// 	lastStatusChange = new Date();
		// }

		saveUser({ _id, username, status: STATUS_MAP[status], statusText }, true);
	});

	Accounts.onLogout(() => {
		interestedUserIds.clear();
	});

	// Notifications.onLogged('Users:NameChanged', ({ _id, username }) => {
	// 	if (!username) {
	// 		return;
	// 	}
	// 	Meteor.users.update({ _id }, {
	// 		$set: {
	// 			username,
	// 		},
	// 	});
	// });
});
