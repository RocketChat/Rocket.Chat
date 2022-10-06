import { UserPresenceMonitor } from 'meteor/konecty:user-presence';
import { AppInterface as AppEvents } from '@rocket.chat/apps-engine/definition/metadata';

import { Apps } from '../../sdk';

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
