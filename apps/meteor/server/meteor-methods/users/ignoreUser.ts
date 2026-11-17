import { ClientSafeError } from '@rocket.chat/core-services';
import { Subscriptions } from '@rocket.chat/models';

import { notifyOnSubscriptionChangedById } from '../../lib/notifyListener';

export const ignoreUser = async (
	fromUserId: string,
	{ rid, userId: ignoredUser, ignore }: { rid: string; userId: string; ignore?: boolean },
): Promise<boolean> => {
	const [subscription, subscriptionIgnoredUser] = await Promise.all([
		Subscriptions.findOneByRoomIdAndUserId(rid, fromUserId),
		Subscriptions.findOneByRoomIdAndUserId(rid, ignoredUser),
	]);

	if (!subscription) {
		throw new ClientSafeError('error-invalid-subscription', 'Invalid subscription', {
			method: 'ignoreUser',
		});
	}

	if (!subscriptionIgnoredUser) {
		throw new ClientSafeError('error-invalid-subscription', 'Invalid subscription', {
			method: 'ignoreUser',
		});
	}

	const result = await Subscriptions.ignoreUser({ _id: subscription._id, ignoredUser, ignore });

	if (result.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	return !!result;
};
