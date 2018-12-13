import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

const saveUser = (user, force = false) => {
	// do not update my own user, my user's status will come from a subscription
	if (user._id === Meteor.userId()) {
		return;
	}
	if (force) {
		return Meteor.users._collection.upsert({ _id: user._id }, {
			$set: {
				username: user.username,
				name: user.name,
				utcOffset: user.utcOffset,
				status: user.status,
			},
		});
	}

	const found = Meteor.users.findOne(user._id, { fields: { _id: 1 } });
	if (found) {
		return;
	}

	Meteor.users._collection.insert(user);
};

let retry = 0;
const getActiveUsers = _.debounce(() => {
	RocketChat.API.v1.get('users.active')
		.then((result) => {
			result.users.forEach((user) => {
				saveUser(user);
			});
		})
		.catch(() => setTimeout(getActiveUsers, retry++ * 2000));
}, 1000);

Tracker.autorun(() => {
	if (!Meteor.userId() || !Meteor.status().connected) {
		return;
	}
	getActiveUsers();
});

Meteor.startup(function() {
	RocketChat.Notifications.onLogged('user-status', (user) => {
		saveUser(user, true);
	});

	RocketChat.Notifications.onLogged('Users:NameChanged', ({ _id, username }) => {
		if (!username) {
			return;
		}
		Meteor.users._collection.upsert({ _id }, {
			$set: {
				username,
			},
		});
	});
});
