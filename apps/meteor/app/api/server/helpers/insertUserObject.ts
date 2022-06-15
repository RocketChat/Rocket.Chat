import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';
import { API } from '../api';

API.helperMethods.set(
	'insertUserObject',
	Meteor.bindEnvironment(function _addUserToObject({ object, userId }: { object: { [key: string]: unknown }; userId: string }) {
		// Maybe `object: { [key: string]: Meteor.User }`?
		const user = Users.findOneById(userId);
		if (user) {
			object.user = {
				_id: userId,
				username: user.username,
				name: user.name,
			};
		}

		return object;
	}),
);
