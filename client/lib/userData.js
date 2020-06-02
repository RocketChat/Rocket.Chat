import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../app/utils/client';
import { Users } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';

export const isSyncReady = new ReactiveVar(false);

function updateUser(userData) {
	const user = Users.findOne({ _id: userData._id });
	if (!user || !user._updatedAt || userData._updatedAt > user._updatedAt.toISOString()) {
		userData._updatedAt = new Date(userData._updatedAt);
		return Meteor.users.upsert({ _id: userData._id }, userData);
	}
	// delete data already on user's collection as those are newer
	Object.keys(user).forEach((key) => delete userData[key]);
	Meteor.users.update({ _id: user._id }, { $set: userData });
}

const onUserEvents = {
	inserted: (_id, data) => Meteor.users.insert(data),
	updated: (_id, { diff }) => Meteor.users.upsert({ _id }, { $set: diff }),
	removed: (_id) => Meteor.users.remove({ _id }),
};

export const syncUserdata = async (uid) => {
	if (!uid) {
		return;
	}

	await Notifications.onUser('userData', ({ type, id, ...data }) => onUserEvents[type](uid, data));

	const userData = await APIClient.v1.get('me');
	if (userData) {
		updateUser(userData);
	}
	isSyncReady.set(true);

	return userData;
};
