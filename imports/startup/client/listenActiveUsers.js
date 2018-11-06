import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

const updateUser = ({
	_id,
	username,
	name,
	utcOffset,
	status,
}) => {
	Meteor.users._collection.upsert({ _id }, {
		$set: {
			username,
			name,
			utcOffset,
			status,
		},
	});
};

Tracker.autorun(() => {
	if (!Meteor.userId()) {
		return;
	}
	RocketChat.API.v1.get('users.actives')
		.then((result) => {
			result.users.forEach((user) => {
				updateUser(user);
			});
		});
});

RocketChat.Notifications.onLogged('user-status', (user) => {
	updateUser(user);
});
