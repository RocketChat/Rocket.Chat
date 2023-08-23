import { Subscriptions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		unblockUser({ rid, blocked }: { rid: string; blocked: string }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async unblockUser({ rid, blocked }) {
		check(rid, String);
		check(blocked, String);
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		const subscription2 = await Subscriptions.findOneByRoomIdAndUserId(rid, blocked);

		if (!subscription || !subscription2) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		await Subscriptions.unsetBlockedByRoomId(rid, blocked, userId);

		return true;
	},
});
