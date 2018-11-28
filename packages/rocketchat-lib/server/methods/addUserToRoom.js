import { Meteor } from 'meteor/meteor';

Meteor.methods({
	addUserToRoom(data) {
		return Meteor.call('addUsersToRoom', {
			rid: data.rid,
			users: [data.username],
		});
	},
});
