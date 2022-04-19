import { Meteor } from 'meteor/meteor';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

import { AppEvents, Apps } from './orchestrator';

UserPresenceMonitor.onSetUserStatus((...args) => {
	const [user, status] = args;
	// App IPostUserStatusChanged event hook
	try {
		Promise.await(
			Apps.triggerEvent(AppEvents.IPostUserStatusChanged, {
				user,
				currentStatus: status,
				previousStatus: user.status,
			}),
		);
	} catch (error) {
		if (error instanceof AppsEngineException) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}
});
