import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { debounce } from 'underscore';

import { Notifications } from '../../../app/notifications/client';
import { APIClient } from '../../../app/utils/client';

const saveUser = (user, force = false) => {
	// do not update my own user, my user's status will come from a subscription
	if (user._id === Meteor.userId()) {
		return;
	}
	if (force) {
		return Meteor.users.upsert({ _id: user._id }, {
			$set: {
				username: user.username,
				// name: user.name,
				// utcOffset: user.utcOffset,
				status: user.status,
			},
		});
	}

	const found = Meteor.users.findOne(user._id, { fields: { _id: 1 } });
	if (found) {
		return;
	}

	Meteor.users.insert(user);
};

let retry = 0;
const getActiveUsers = debounce(async () => {
	try {
		const { users } = await APIClient.v1.get('users.active');
		users.forEach(saveUser);
	} catch (e) {
		setTimeout(getActiveUsers, retry++ * 2000);
	}
}, 1000);

let wasConnected = false;
Tracker.autorun(() => {
	if (!Meteor.userId() || !Meteor.status().connected) {
		return;
	}

	// if is reconnecting, set everyone else to offline
	if (wasConnected) {
		Meteor.users.update({
			_id: { $ne: Meteor.userId() },
		}, {
			$set: {
				status: 'offline',
			},
		}, { multi: true });
	}

	wasConnected = true;

	getActiveUsers();
});

Meteor.startup(function() {
	Notifications.onLogged('user-status', (user) => {
		saveUser(user, true);
	});

	Notifications.onLogged('Users:NameChanged', ({ _id, username }) => {
		if (!username) {
			return;
		}
		Meteor.users.upsert({ _id }, {
			$set: {
				username,
			},
		});
	});
});
