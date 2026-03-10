import { Apps, AppEvents } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Message, Team, Room } from '@rocket.chat/core-services';
import { isRoomNativeFederated, type IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { callbacks } from '../../../../server/lib/callbacks';
import { afterUnbanFromRoomCallback } from '../../../../server/lib/callbacks/afterUnbanFromRoomCallback';
import { beforeAddUserToRoom } from '../../../../server/lib/callbacks/beforeAddUserToRoom';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { settings } from '../../../settings/server';
import { beforeAddUserToRoom as beforeAddUserToRoomPatch } from '../lib/beforeAddUserToRoom';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

/**
 * This function adds user to the given room.
 * Caution - It does not validates if the user has permission to join room
 */

export const addUserToRoom = async (
	rid: string,
	user: Pick<IUser, '_id' | 'username'>,
	inviter?: Pick<IUser, '_id' | 'username'>,
	{
		skipSystemMessage,
		skipAlertSound,
		createAsHidden = false,
	}: {
		skipSystemMessage?: boolean;
		skipAlertSound?: boolean;
		createAsHidden?: boolean;
	} = {},
): Promise<boolean | undefined> => {
	const now = new Date();
	const room = await Rooms.findOneById(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'addUserToRoom',
		});
	}

	const userToBeAdded = await Users.findOneById(user._id);
	const roomDirectives = roomCoordinator.getRoomDirectives(room.t);

	if (!userToBeAdded) {
		throw new Meteor.Error('user-not-found');
	}

	// Check if user is already in room
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userToBeAdded._id);
	if (subscription) {
		// If the user is banned, unban them via re-invite
		if (subscription.status === 'BANNED') {
			await Subscriptions.unbanByRoomIdAndUserId(rid, userToBeAdded._id);

			// Re-add the room to the user's __rooms array for member listing
			await Users.addRoomByUserId(userToBeAdded._id, rid);

			// Increment the room's user count
			await Rooms.incUsersCountById(rid, 1);

			// Save system message for unban
			if (!skipSystemMessage && userToBeAdded.username) {
				if (inviter) {
					await Message.saveSystemMessage('user-unbanned', rid, userToBeAdded.username, userToBeAdded, {
						u: { _id: inviter._id, username: inviter.username },
					});
				} else {
					await Message.saveSystemMessage('user-unbanned', rid, userToBeAdded.username, userToBeAdded);
				}
			}

			// Send 'inserted' so the client re-subscribes to the room stream
			// (the ban sent 'removed' which caused the client to drop it)
			const unbannedSubscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userToBeAdded._id);
			if (unbannedSubscription) {
				void notifyOnSubscriptionChanged(unbannedSubscription, 'inserted');
			}
			void notifyOnRoomChangedById(rid);

			if (inviter) {
				const inviterUser = await Users.findOneById(inviter._id);
				if (inviterUser) {
					setImmediate(() => {
						void afterUnbanFromRoomCallback.run({ unbannedUser: userToBeAdded, userWhoUnbanned: inviterUser }, room);
					});
				}
			}

			return true;
		}

		// User already has an active subscription — nothing to do
		return;
	}

	if (
		!(await roomDirectives.allowMemberAction(room, RoomMemberActions.JOIN, userToBeAdded._id)) &&
		!(await roomDirectives.allowMemberAction(room, RoomMemberActions.INVITE, userToBeAdded._id))
	) {
		return;
	}

	try {
		const inviterUser = inviter && ((await Users.findOneById(inviter._id)) || undefined);
		// Not "duplicated": we're moving away from callbacks so this is a patch function. We should migrate the next one to be a patch or use this same patch, instead of calling both
		await beforeAddUserToRoomPatch([userToBeAdded.username!], room, inviterUser);
		await beforeAddUserToRoom.run({ user: userToBeAdded, inviter: inviterUser }, room);
	} catch (error) {
		throw new Meteor.Error((error as any)?.message);
	}

	// TODO: are we calling this twice?

	await callbacks.run('beforeAddedToRoom', { user: userToBeAdded, inviter });

	try {
		await Apps.self?.triggerEvent(AppEvents.IPreRoomUserJoined, room, userToBeAdded, inviter);
	} catch (error: any) {
		if (error.name === AppsEngineException.name) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}

	// for federation rooms we stop here since everything else will be handled by the federation invite flow
	if (isRoomNativeFederated(room)) {
		return;
	}

	// TODO: are we calling this twice?
	if (room.t === 'c' || room.t === 'p' || room.t === 'l') {
		// Add a new event, with an optional inviter
		await callbacks.run('beforeAddedToRoom', { user: userToBeAdded, inviter }, room);

		// Keep the current event
		await callbacks.run('beforeJoinRoom', userToBeAdded, room);
	}

	await Room.createUserSubscription({
		room,
		ts: now,
		inviter,
		userToBeAdded,
		createAsHidden,
		skipAlertSound,
		skipSystemMessage,
	});

	if (room.t === 'c' || room.t === 'p') {
		process.nextTick(async () => {
			// Add a new event, with an optional inviter
			await callbacks.run('afterAddedToRoom', { user: userToBeAdded, inviter }, room);

			// Keep the current event
			await callbacks.run('afterJoinRoom', userToBeAdded, room);

			void Apps.self?.triggerEvent(AppEvents.IPostRoomUserJoined, room, userToBeAdded, inviter);
		});
	}

	if (room.teamMain && room.teamId) {
		// if user is joining to main team channel, create a membership
		await Team.addMember(inviter || userToBeAdded, userToBeAdded._id, room.teamId);
	}

	if (room.encrypted && settings.get('E2E_Enable') && userToBeAdded.e2e?.public_key) {
		await Rooms.addUserIdToE2EEQueueByRoomIds([room._id], userToBeAdded._id);
	}

	void notifyOnRoomChangedById(rid);
	return true;
};
