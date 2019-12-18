import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../app/utils/client';
import { Users } from '../../app/models/client';

export const userReady = new ReactiveVar(false);

export const updateUserData = async (uid) => {
	if (!uid) {
		return;
	}

	const userData = await APIClient.v1.get('me');
	if (userData) {
		const user = Users.findOne({ _id: userData._id });
		if (!user || userData._updatedAt > user._updatedAt) {
			Meteor.users.upsert({ _id: userData._id }, userData);
		} else {
			// delete data already on user's collection as those are newer
			Object.keys(user).forEach((key) => delete userData[key]);
			Meteor.users.update({ _id: user._id }, { $set: userData });
		}
	}
	userReady.set(true);

	return userData;
};
