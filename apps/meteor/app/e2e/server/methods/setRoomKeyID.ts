import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { notifyOnRoomChangedById } from '../../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.setRoomKeyID'(rid: IRoom['_id'], keyID: string): void;
	}
}

export const setRoomKeyIDMethod = async (userId: string, rid: IRoom['_id'], keyID: string): Promise<void> => {
	if (!(await canAccessRoomIdAsync(rid, userId))) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.setRoomKeyID' });
	}

	const { matchedCount } = await Rooms.setE2eKeyIdIfNotSet(rid, keyID);

	if (!matchedCount) {
		throw new Meteor.Error('error-room-e2e-key-already-exists', 'E2E Key ID already exists', {
			method: 'e2e.setRoomKeyID',
		});
	}

	void notifyOnRoomChangedById(rid);
};

Meteor.methods<ServerMethods>({
	async 'e2e.setRoomKeyID'(rid, keyID) {
		check(rid, String);
		check(keyID, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.setRoomKeyID' });
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.setRoomKeyID' });
		}

		await setRoomKeyIDMethod(userId, rid, keyID);
	},
});
