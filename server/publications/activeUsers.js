import { Meteor } from 'meteor/meteor';

const findActiveUsers = () => RocketChat.models.Users.findUsersNotOffline({
	fields: {
		username: 1,
		name: 1,
		status: 1,
		utcOffset: 1,
	},
});

Meteor.publish('activeUsers', function() {
	if (!this.userId) {
		return this.ready();
	}

	return findActiveUsers();
});

Meteor.methods({
	getActiveUsers() {
		if (!this.userId) {
			return this.ready();
		}

		const users = findActiveUsers().fetch();

		return { users };
	},
});
