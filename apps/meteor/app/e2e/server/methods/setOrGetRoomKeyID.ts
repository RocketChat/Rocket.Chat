import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { notifyOnRoomChangedById } from '../../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.setOrGetRoomKeyID'(rid: IRoom['_id'], keyID: string): {
			keyID: string;
			suggestedKey: string;
		};
	}
}

export const setOrGetRoomKeyIDMethod = async (userId: string, rid: IRoom['_id'], keyID: string): Promise<{ keyID: string; suggestedKey?: string }> => {
	if (!(await canAccessRoomIdAsync(rid, userId))) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.setOrGetRoomKeyID' });
	}

	const room = await Rooms.findOneById<Pick<IRoom, '_id' | 'e2eKeyId'>>(rid, { projection: { e2eKeyId: 1 } });

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.setOrGetRoomKeyID' });
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId, { projection: { E2ESuggestedKey: 1 } })

	if (room.e2eKeyId) {
		return {
			keyID: room.e2eKeyId; // Return existing keyID if it already exists
			suggestedKey: subscription?.E2ESuggestedKey;
		}
	}

	await Rooms.setE2eKeyId(room._id, keyID);

	void notifyOnRoomChangedById(room._id);

	return {
		keyID
	}; // Return the newly set keyID
};

Meteor.methods<ServerMethods>({
	async 'e2e.setOrGetRoomKeyID'(rid, keyID) {
		check(rid, String);
		check(keyID, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.setOrGetRoomKeyID' });
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.setOrGetRoomKeyID' });
		}

		console.log('apps/meteor/app/e2e/server/methods/setOrGetRoomKeyID.ts e2e.setOrGetRoomKeyID');
		return await setOrGetRoomKeyIDMethod(userId, rid, keyID);
	},
});
