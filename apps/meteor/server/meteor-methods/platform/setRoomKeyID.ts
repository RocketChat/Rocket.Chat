import { ClientSafeError } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { updateGroupKey } from './updateGroupKey';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { notifyOnRoomChanged } from '../../lib/notifyListener';

// `key` is the room key encrypted for the caller. Sent with the key id, it is saved in the same request, so the
// room never has a key id that no member holds.
export const setRoomKeyIDMethod = async (userId: string, rid: IRoom['_id'], keyID: string, key?: string): Promise<void> => {
	if (!(await canAccessRoomIdAsync(rid, userId))) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'e2e.setRoomKeyID' });
	}

	const room = await Rooms.setE2eKeyId(rid, keyID);

	if (!room) {
		throw new ClientSafeError('error-room-e2e-key-already-exists', 'E2E Key ID already exists', {
			method: 'e2e.setRoomKeyID',
		});
	}

	void notifyOnRoomChanged(room);

	if (key) {
		await updateGroupKey(rid, userId, key, userId);
	}
};
