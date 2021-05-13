import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models/server';

Meteor.methods({
	setRecentlyVisitedRoom(rid) {
		const user = Meteor.user();

		if (user == null || rid == null) {
			return;
		}

		return Users.setRecentlyVisitedRoom(user._id, rid);
	},
});
