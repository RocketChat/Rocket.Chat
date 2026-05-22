import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedById } from '../../lib/notifyListener';

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
