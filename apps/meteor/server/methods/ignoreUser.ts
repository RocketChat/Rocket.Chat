import { Subscriptions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		ignoreUser(params: { rid: string; userId: string; ignore?: boolean }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async ignoreUser({ rid, userId: ignoredUser, ignore = true }) {
		check(ignoredUser, String);
		check(rid, String);
		check(ignore, Boolean);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'ignoreUser',
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);

		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'ignoreUser',
			});
		}

		const subscriptionIgnoredUser = await Subscriptions.findOneByRoomIdAndUserId(rid, ignoredUser);

		if (!subscriptionIgnoredUser) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'ignoreUser',
			});
		}

		return !!(await Subscriptions.ignoreUser({ _id: subscription._id, ignoredUser, ignore }));
	},
});
