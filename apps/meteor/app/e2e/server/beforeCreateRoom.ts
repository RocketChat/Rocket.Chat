import { Meteor } from 'meteor/meteor';

import { prepareCreateRoomCallback } from '../../../server/lib/callbacks/beforeCreateRoomCallback';
import { settings } from '../../settings/server';

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

	// Workspace policy can force every newly created private room to be encrypted,
	// rejecting any attempt to opt-out (e.g. an API request with `encrypted: false`).
	if (type === 'p' && settings.get<boolean>('E2E_Force_Encryption_For_Private_Rooms')) {
		if (extraData.encrypted === false) {
			throw new Meteor.Error('error-encrypted-private-rooms-enforced', 'Workspace policy requires all private rooms to be encrypted.');
		}
		extraData.encrypted = true;
	}
});
