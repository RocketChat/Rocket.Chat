import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../app/utils/client';

export const updateUserData = async () => {
	const userData = await APIClient.v1.get('me');
	if (userData) {
		Meteor.users.upsert({ _id: userData._id }, { ...userData });
	}
};
