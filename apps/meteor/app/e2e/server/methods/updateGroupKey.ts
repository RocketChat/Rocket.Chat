import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import {
	notifyOnSubscriptionChangedById,
	notifyOnSubscriptionChanged,
	notifyOnRoomChangedById,
} from '../../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.updateGroupKey'(rid: string, uid: string, key: string): Promise<void>;
	}
}

export async function updateGroupKey(rid: string, uid: string, key: string, callerUserId: string) {
	// I have a subscription to this room
	const mySub = await Subscriptions.findOneByRoomIdAndUserId(rid, callerUserId);

	if (mySub) {
		// Setting the key to myself, can set directly to the final field
		if (callerUserId === uid) {
			const setGroupE2EKeyResponse = await Subscriptions.setGroupE2EKey(mySub._id, key);
			// Case: I create an encrypted room before setting up my keys, and I reset the e2e keys
			// Next login, I'll create the keys for the room, and set them here.
			// However as I reset my keys, I'm on the `usersWaitingForKeys` queue
			// So I need to remove myself from the queue and notify the time i reach here
			// This way, I can provide the keys to other users
			const { modifiedCount } = await Rooms.removeUsersFromE2EEQueueByRoomId(mySub.rid, [callerUserId]);
			if (setGroupE2EKeyResponse.modifiedCount) {
				void notifyOnSubscriptionChangedById(mySub._id);
			}
			if (modifiedCount) {
				void notifyOnRoomChangedById(mySub.rid);
			}
			return;
		}

		// uid also has subscription to this room
		const value = await Subscriptions.setGroupE2ESuggestedKey(uid, rid, key);
		if (value) {
			void notifyOnSubscriptionChanged(value);
		}
	}
}

Meteor.methods<ServerMethods>({
	async 'e2e.updateGroupKey'(rid, uid, key) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.acceptSuggestedGroupKey' });
		}

		methodDeprecationLogger.method('e2e.updateGroupKey', '8.0.0');
		return updateGroupKey(rid, uid, key, userId);
	},
});
