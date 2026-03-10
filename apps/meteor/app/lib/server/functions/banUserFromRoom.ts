import { Message } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { afterBanFromRoomCallback } from '../../../../server/lib/callbacks/afterBanFromRoomCallback';
import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

/**
 * Bans a user from a room when triggered by federation or other external events.
 * Executes only the necessary database operations, with no callbacks, to prevent
 * propagation loops during external event processing.
 */
export const performUserBan = async function (room: IRoom, user: IUser, options?: { byUser?: IUser }): Promise<void> {
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
	if (!subscription) {
		return;
	}

	if (!user.username) {
		throw new Error('User must have a username to be banned from the room');
	}

	// Already banned — nothing to do
	if (subscription.status === 'BANNED') {
		return;
	}

	// Set subscription status to BANNED (keeps the record, unlike kick which deletes it)
	await Subscriptions.banByRoomIdAndUserId(room._id, user._id);

	// Remove the room from the user's __rooms array so they don't appear in member listings
	await Users.removeRoomByUserId(user._id, room._id);

	// Decrement the room's user count
	await Rooms.incUsersCountById(room._id, -1);

	// Remove room-scoped roles (moderator, owner, leader)
	if (['c', 'p'].includes(room.t)) {
		await removeUserFromRolesAsync(user._id, ['moderator', 'owner', 'leader'], room._id);
	}

	// Save system message
	if (options?.byUser) {
		const extraData = {
			u: options.byUser,
		};
		await Message.saveSystemMessage('user-banned', room._id, user.username, user, extraData);
	} else {
		await Message.saveSystemMessage('user-banned', room._id, user.username, user);
	}

	// Send 'removed' so the client drops the room stream/socket subscription.
	// The record still exists in DB with status BANNED for access-control purposes.
	void notifyOnSubscriptionChanged(subscription, 'removed');
	void notifyOnRoomChangedById(room._id);
};

/**
 * Bans a user from the given room by updating the subscription status to BANNED,
 * removing them from member listings, and triggering all standard callbacks.
 * Used for local actions (UI or API) that should propagate normally to federation
 * and other subscribers.
 */
export const banUserFromRoom = async function (rid: string, user: IUser, options?: { byUser?: IUser }): Promise<void> {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'banUserFromRoom',
		});
	}

	await performUserBan(room, user, options);

	if (options?.byUser) {
		setImmediate(() => {
			void afterBanFromRoomCallback.run({ bannedUser: user, userWhoBanned: options.byUser! }, room);
		});
	}
};
