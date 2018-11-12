import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	logoutCleanUp(user) {
		check(user, Object);

		Meteor.defer(function() {
			RocketChat.callbacks.run('afterLogoutCleanUp', user);
		});
	},
});
