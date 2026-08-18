import { Presence } from '@rocket.chat/core-services';

import { broadcastStatusVisibility } from '../lib/statusVisibility/broadcastStatusVisibility';
import { refreshStatusVisibility } from '../lib/statusVisibility/canSeeStatus';
import { settings } from '../settings';

// maybe this setting should disable the listener to 'presence.status' event on listerners.module.ts
settings.watch('Troubleshoot_Disable_Presence_Broadcast', async (value) => {
	try {
		await Presence.toggleBroadcast(!value);
	} catch (e) {
		// do nothing
	}
});

settings.watch(
	'Accounts_StatusVisibility_Enabled',
	async () => {
		try {
			await refreshStatusVisibility();
		} catch (e) {
			// do nothing
		}

		broadcastStatusVisibility();
	},
	{ debounce: 1000 },
);
