import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { afterUnbanFromRoomCallback } from '../../../../server/lib/callbacks/afterUnbanFromRoomCallback';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

export const executeUnbanUserFromRoom = async function (rid: string, user: IUser, byUser: IUser): Promise<void> {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Error('error-invalid-room');
	}

	if (!user.username) {
		throw new Error('error-invalid-user');
	}

	const subscription = await Subscriptions.findOneBannedSubscription(rid, user._id);
	if (!subscription) {
		throw new Error('error-user-not-banned');
	}

	// Remove the subscription entirely — the user is no longer banned but also not a member.
	// Room count and __rooms were already adjusted during ban, so we only delete the document.
	await Subscriptions.removeById(subscription._id);

	await Message.saveSystemMessage('user-unbanned', rid, user.username, user, {
		u: { _id: byUser._id, username: byUser.username },
	});

	void notifyOnSubscriptionChanged(subscription, 'removed');
	void notifyOnRoomChangedById(rid);

	const inviterUser = await Users.findOneById(byUser._id);
	if (inviterUser) {
		await afterUnbanFromRoomCallback.run({ unbannedUser: user, userWhoUnbanned: inviterUser }, room);
	}
};
