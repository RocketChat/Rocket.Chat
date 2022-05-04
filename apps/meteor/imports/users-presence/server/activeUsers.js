import { UserStatus } from '@rocket.chat/core-typings';
import { UserPresenceEvents } from 'meteor/konecty:user-presence';

import { settings } from '../../../app/settings/server';
import { api } from '../../../server/sdk/api';

export const STATUS_MAP = {
	[UserStatus.OFFLINE]: 0,
	[UserStatus.ONLINE]: 1,
	[UserStatus.AWAY]: 2,
	[UserStatus.BUSY]: 3,
};

export const setUserStatus = (user, status /* , statusConnection*/) => {
	const { _id, username, statusText } = user;

	// since this callback can be called by only one instance in the cluster
	// we need to broadcast the change to all instances
	api.broadcast('presence.status', {
		user: { status, _id, username, statusText }, // TODO remove username
	});
};

let TroubleshootDisablePresenceBroadcast;
settings.watch('Troubleshoot_Disable_Presence_Broadcast', (value) => {
	if (TroubleshootDisablePresenceBroadcast === value) {
		return;
	}
	TroubleshootDisablePresenceBroadcast = value;

	if (value) {
		return UserPresenceEvents.removeListener('setUserStatus', setUserStatus);
	}

	UserPresenceEvents.on('setUserStatus', setUserStatus);
});
