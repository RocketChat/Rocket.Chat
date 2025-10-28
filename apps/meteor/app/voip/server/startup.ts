import { VoipAsterisk } from '@rocket.chat/core-services';

import { settings } from '../../settings/server';

settings.watch('VoIP_Enabled', async (value: boolean) => {
	try {
		if (value) {
			await VoipAsterisk.init();
		} else {
			await VoipAsterisk.stop();
		}
	} catch (e) {
		// do nothing
	}
});

settings.changeMultiple(
	['VoIP_Management_Server_Host', 'VoIP_Management_Server_Port', 'VoIP_Management_Server_Username', 'VoIP_Management_Server_Password'],
	async (_values) => {
		// Here, if 4 settings are changed at once, we're getting 4 diff callbacks. The good part is that all callbacks are fired almost instantly
		// So to avoid stopping/starting voip too often, we debounce the call and restart 1 second after the last setting has reached us.
		if (settings.get('VoIP_Enabled')) {
			try {
				await VoipAsterisk.refresh();
			} catch (e) {
				// do nothing
			}
		}
	},
);
