import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';

import { callbacks } from '../../lib/callbacks';
import { AppEvents, Apps } from '../../app/apps/server/orchestrator';

Meteor.methods({
	logoutCleanUp(user) {
		check(user, Object);

		Meteor.defer(function () {
			callbacks.run('afterLogoutCleanUp', user);
		});

		// App IPostUserLogout event hook
		try {
			Promise.await(Apps.triggerEvent(AppEvents.IPostUserLoggedOut, user));
		} catch (error) {
			if (error instanceof AppsEngineException) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}
	},
});
