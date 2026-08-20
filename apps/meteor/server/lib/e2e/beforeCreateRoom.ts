import { MeteorError } from '@rocket.chat/core-services';

import { settings } from '../../settings';
import { prepareCreateRoomCallback } from '../callbacks/beforeCreateRoomCallback';

prepareCreateRoomCallback.add(({ type, extraData }) => {
	if (!settings.get<boolean>('E2E_Enable')) {
		return;
	}

	if (
		(type === 'd' && settings.get<boolean>('E2E_Enabled_Default_DirectRooms')) ||
		(type === 'p' && settings.get<boolean>('E2E_Enabled_Default_PrivateRooms'))
	) {
		extraData.encrypted = extraData.encrypted ?? true;
	}
	if (type === 'p' && extraData.federated !== true && settings.get<boolean>('E2E_Force_Encryption_For_Private_Rooms')) {
		if (extraData.encrypted === false) {
			throw new MeteorError('error-encrypted-private-rooms-enforced', 'Workspace policy requires all private rooms to be encrypted.');
		}
		extraData.encrypted = true;
	}
});
