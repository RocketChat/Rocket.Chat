import { Subscriptions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.updateGroupKey'(rid: string, uid: string, key: string): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async 'e2e.updateGroupKey'(rid, uid, key) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.acceptSuggestedGroupKey' });
		}

		// I have a subscription to this room
		const mySub = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);

		if (mySub) {
			// Setting the key to myself, can set directly to the final field
			if (userId === uid) {
				await Subscriptions.setGroupE2EKey(mySub._id, key);
				return;
			}

			// uid also has subscription to this room
			const userSub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (userSub) {
				await Subscriptions.setGroupE2ESuggestedKey(userSub._id, key);
			}
		}
	},
});
