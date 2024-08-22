import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { notifyOnSubscriptionChangedById, notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.updateGroupKey'(rid: string, uid: string, key: string): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async 'e2e.updateGroupKey'(rid, uid, key) {
		methodDeprecationLogger.method('e2e.updateGroupKey', '8.0.0');
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.acceptSuggestedGroupKey' });
		}

		// I have a subscription to this room
		const mySub = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);

		if (mySub) {
			// Setting the key to myself, can set directly to the final field
			if (userId === uid) {
				const setGroupE2EKeyResponse = await Subscriptions.setGroupE2EKey(mySub._id, key);
				if (setGroupE2EKeyResponse.modifiedCount) {
					void notifyOnSubscriptionChangedById(mySub._id);
				}
				return;
			}

			// uid also has subscription to this room
			const { modifiedCount } = await Subscriptions.setGroupE2ESuggestedKey(uid, rid, key);
			if (modifiedCount) {
				void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, uid);
			}
		}
	},
});
