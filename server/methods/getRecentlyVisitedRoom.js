import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../app/models/server';

Meteor.methods({
	getRecentlyVisitedRoom() {
		const user = Meteor.user();
		if (user && user.recentlyVisitedRoom) {
			return Rooms.findOneById(user.recentlyVisitedRoom);
		}
	},
});
