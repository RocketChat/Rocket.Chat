import { callbacks } from '../../callbacks';
import { settings } from '../../settings';

callbacks.add('beforeCreateRoom', ({ type, extraData }) => {
	if (['d', 'p'].includes(type)) {
		if (
			(type === 'd' && settings.get('E2E_Enabled_Default_DirectRooms'))
			|| (type === 'p' && settings.get('E2E_Enabled_Default_PrivateRooms'))
		) {
			extraData.encrypted = true;
		}
	}
});
