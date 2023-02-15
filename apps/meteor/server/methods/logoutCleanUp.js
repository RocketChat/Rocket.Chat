import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { AppInterface as AppEvents } from '@rocket.chat/apps-engine/definition/metadata';
import { Apps } from '@rocket.chat/core-services';

import { callbacks } from '../../lib/callbacks';

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
