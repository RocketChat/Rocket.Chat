import { UserPresenceMonitor } from 'meteor/konecty:user-presence';

import { AppEvents, Apps } from './orchestrator';

UserPresenceMonitor.onSetUserStatus((...args: any) => {
	const [user, status] = args;

	// App IPostUserStatusChanged event hook
	Promise.await(
		Apps.triggerEvent(AppEvents.IPostUserStatusChanged, {
			user,
			currentStatus: status,
			previousStatus: user.status,
		}),
	);
});
