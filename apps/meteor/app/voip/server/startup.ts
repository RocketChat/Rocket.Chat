import debounce from 'lodash.debounce';

import { settings } from '../../settings/server';
import { Voip } from '../../../server/sdk';
import { api } from '../../../server/sdk/api';

const debouncedRefresh = debounce(Voip.refresh, 1000);

settings.watch('VoIP_Enabled', async (value: boolean) => {
	const data = value ? await Voip.init() : Voip.stop();
	api.broadcast('connector.statuschanged', value);
	return data;
});

settings.changeMultiple(
	['VoIP_Management_Server_Host', 'VoIP_Management_Server_Port', 'VoIP_Management_Server_Username', 'VoIP_Management_Server_Password'],
	(_values) => {
		// Here, if 4 settings are changed at once, we're getting 4 diff callbacks. The good part is that all callbacks are fired almost instantly
		// So to avoid stopping/starting voip too often, we debounce the call and restart 1 second after the last setting has reached us.
		return debouncedRefresh();
	},
);
