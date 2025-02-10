import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedById } from '../../app/lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		ignoreUser(params: { rid: string; userId: string; ignore?: boolean }): boolean;
	}
}

export const ignoreUser = async (
	fromUserId: string,
	{ rid, userId: ignoredUser, ignore }: { rid: string; userId: string; ignore?: boolean },
): Promise<boolean> => {
	const [subscription, subscriptionIgnoredUser] = await Promise.all([
		Subscriptions.findOneByRoomIdAndUserId(rid, fromUserId),
		Subscriptions.findOneByRoomIdAndUserId(rid, ignoredUser),
	]);

	if (!subscription) {
		throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
			method: 'ignoreUser',
		});
	}

	if (!subscriptionIgnoredUser) {
		throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
			method: 'ignoreUser',
		});
	}

	const result = await Subscriptions.ignoreUser({ _id: subscription._id, ignoredUser, ignore });

	if (result.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	return !!result;
};

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

		return ignoreUser(userId, { rid, userId: ignoredUser, ignore });
	},
});
