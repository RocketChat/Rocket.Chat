import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { callbacks } from '../../lib/callbacks';
import { AppEvents, Apps } from '../../app/apps/server/orchestrator';

Meteor.methods({
	logoutCleanUp(user) {
		check(user, Object);

		Meteor.defer(function () {
			callbacks.run('afterLogoutCleanUp', user);
		});

		// App IPostUserLogout event hook
		Promise.await(Apps.triggerEvent(AppEvents.IPostUserLoggedOut, user));
	},
});
