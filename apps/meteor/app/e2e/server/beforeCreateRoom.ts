import { beforeCreateRoomCallback } from '../../../lib/callbacks/beforeCreateRoomCallback';
import { settings } from '../../settings/server';

beforeCreateRoomCallback.add(({ type, extraData }) => {
	if (
		settings.get<boolean>('E2E_Enable') &&
		((type === 'd' && settings.get<boolean>('E2E_Enabled_Default_DirectRooms')) ||
			(type === 'p' && settings.get<boolean>('E2E_Enabled_Default_PrivateRooms')))
	) {
		extraData.encrypted = extraData.encrypted ?? true;
	}
});
