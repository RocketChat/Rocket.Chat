import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

const updateUser = (user, force = false) => {
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
	if (Meteor.users.findOne(user._id, { fields: { _id: 1 } })) {
		return;
	}
	Meteor.users._collection.insert(user);
};
Tracker.autorun(async() => {
	if (!Meteor.userId()) {
		return;
	}
	let result = await RocketChat.API.v1.get('users.actives');
	while (result) {
		try {
			result = await RocketChat.API.v1.get('users.actives');
		} catch (error) {
			console.log(error);
		}
	}
	result.users.forEach(updateUser);
});

RocketChat.Notifications.onLogged('user-status', (user) => updateUser(user, true));
