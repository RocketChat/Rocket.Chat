import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { callbacks } from '../../lib/callbacks';

Meteor.methods({
	logoutCleanUp(user) {
		check(user, Object);

		Meteor.defer(function () {
			callbacks.run('afterLogoutCleanUp', user);
		});
	},
});
