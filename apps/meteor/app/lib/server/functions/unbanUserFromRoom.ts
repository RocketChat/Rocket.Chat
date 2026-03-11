import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { afterUnbanFromRoomCallback } from '../../../../server/lib/callbacks/afterUnbanFromRoomCallback';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

export const unbanUserFromRoom = async function (rid: string, user: IUser, options?: { byUser?: IUser }): Promise<void> {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'unbanUserFromRoom',
		});
	}

	if (!user.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'unbanUserFromRoom',
		});
	}

	const subscription = await Subscriptions.findBannedSubscription(rid, user._id);
	if (!subscription) {
		throw new Meteor.Error('error-user-not-banned', 'User is not banned from this room', {
			method: 'unbanUserFromRoom',
		});
	}

	await Subscriptions.unbanByRoomIdAndUserId(rid, user._id);

	// Re-add the room to the user's __rooms array for member listing
	await Users.addRoomByUserId(user._id, rid);

	// Increment the room's user count
	await Rooms.incUsersCountById(rid, 1);

	// Save system message for unban
	if (options?.byUser) {
		await Message.saveSystemMessage('user-unbanned', rid, user.username, user, {
			u: { _id: options.byUser._id, username: options.byUser.username },
		});
	} else {
		await Message.saveSystemMessage('user-unbanned', rid, user.username, user);
	}

	// Send 'inserted' so the client re-subscribes to the room stream
	const unbannedSubscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (unbannedSubscription) {
		void notifyOnSubscriptionChanged(unbannedSubscription, 'inserted');
	}
	void notifyOnRoomChangedById(rid);

	if (options?.byUser) {
		setImmediate(() => {
			void afterUnbanFromRoomCallback.run({ unbannedUser: user, userWhoUnbanned: options.byUser! }, room);
		});
	}
};
