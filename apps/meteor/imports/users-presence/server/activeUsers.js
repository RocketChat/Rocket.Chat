import { UserStatus } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import { api } from '../../../server/sdk/api';
import { Presence } from '../../../server/sdk';

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

// maybe this setting should disable the listener to 'presence.status' event on listerners.module.ts
settings.watch('Troubleshoot_Disable_Presence_Broadcast', (value) => Presence.toggleBroadcast(!value));
