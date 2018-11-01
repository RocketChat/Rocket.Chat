import { Meteor } from 'meteor/meteor';

Meteor.methods({
	logoutCleanUp(user) {
		check(user, Object);

		Meteor.defer(function() {
			RocketChat.callbacks.run('afterLogoutCleanUp', user);
		});
	},
});
