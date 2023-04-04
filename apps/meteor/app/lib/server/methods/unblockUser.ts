import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Subscriptions } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		unblockUser({ rid, blocked }: { rid: string; blocked: string }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	unblockUser({ rid, blocked }) {
		check(rid, String);
		check(blocked, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		const subscription2 = Subscriptions.findOneByRoomIdAndUserId(rid, blocked);

		if (!subscription || !subscription2) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		Subscriptions.unsetBlockedByRoomId(rid, blocked, Meteor.userId());

		return true;
	},
});
