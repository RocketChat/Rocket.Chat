import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';

callbacks.add('beforeCreateRoom', ({ type, extraData }) => {
	if (
		settings.get('E2E_Enable') &&
		((type === 'd' && settings.get('E2E_Enabled_Default_DirectRooms')) ||
			(type === 'p' && settings.get('E2E_Enabled_Default_PrivateRooms')))
	) {
		extraData.encrypted = extraData.encrypted ?? true;
	}
});
