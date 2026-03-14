import { Message } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { afterUnbanFromRoomCallback } from '../../../../server/lib/callbacks/afterUnbanFromRoomCallback';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

export type UnbanSideEffectsOptions = {
	byUser?: Pick<IUser, '_id' | 'username'> | IUser;
	skipSystemMessage?: boolean;
};

/**
 * Applies the standard side effects after unbanning a user from a room (re-add to __rooms,
 * increment count, system message, notify, callback). Shared by unbanUserFromRoom and
 * addUserToRoom (re-invite path) so behavior stays in sync.
 */
export const performUnbanSideEffects = async (rid: string, room: IRoom, user: IUser, options?: UnbanSideEffectsOptions): Promise<void> => {
	await Users.addRoomByUserId(user._id, rid);
	await Rooms.incUsersCountById(rid, 1);

	if (!options?.skipSystemMessage && user.username) {
		if (options?.byUser) {
			await Message.saveSystemMessage('user-unbanned', rid, user.username, user, {
				u: { _id: options.byUser._id, username: options.byUser.username },
			});
		} else {
			await Message.saveSystemMessage('user-unbanned', rid, user.username, user);
		}
	}

	const unbannedSubscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (unbannedSubscription) {
		void notifyOnSubscriptionChanged(unbannedSubscription, 'inserted');
	}
	void notifyOnRoomChangedById(rid);

	if (options?.byUser) {
		const inviterUser = await Users.findOneById(options.byUser._id);
		if (inviterUser) {
			setImmediate(() => {
				void afterUnbanFromRoomCallback.run({ unbannedUser: user, userWhoUnbanned: inviterUser }, room);
			});
		}
	}
};

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
	await performUnbanSideEffects(rid, room, user, { byUser: options?.byUser });
};
