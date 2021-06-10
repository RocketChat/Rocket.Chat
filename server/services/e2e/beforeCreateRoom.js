import { callbacks } from '../../utils/hooks';
import { settings } from '../../settings';

callbacks.add('beforeCreateRoom', ({ type, extraData }) => {
	if (
		settings.get('E2E_Enabled') && ((type === 'd' && settings.get('E2E_Enabled_Default_DirectRooms'))
		|| (type === 'p' && settings.get('E2E_Enabled_Default_PrivateRooms')))
	) {
		extraData.encrypted = extraData.encrypted ?? true;
	}
});
