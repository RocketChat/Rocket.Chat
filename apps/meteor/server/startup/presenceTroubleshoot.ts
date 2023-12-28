import { Presence } from '@rocket.chat/core-services';

import { settings } from '../../app/settings/server';

// maybe this setting should disable the listener to 'presence.status' event on listerners.module.ts
settings.watch('Troubleshoot_Disable_Presence_Broadcast', async (value) => {
	try {
		await Presence.toggleBroadcast(!value);
	} catch (e) {
		// do nothing
	}
});
