import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

const updateUser = (user, force = false) => {
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
function getActiveUsers() {
	RocketChat.API.v1.get('users.actives')
		.then((result) => {
			result.users.forEach((user) => {
				updateUser(user);
			});
		})
		.catch(() => setTimeout(getActiveUsers, retry++ * 2000));
}

Tracker.autorun(() => {
	if (!Meteor.userId()) {
		return;
	}
	getActiveUsers();
});

RocketChat.Notifications.onLogged('user-status', (user) => {
	updateUser(user, true);
});
