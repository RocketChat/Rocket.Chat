import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms } from '@rocket.chat/models';

import { canAccessRoomAsync } from './canAccessRoom';
import { hasPermissionAsync } from './hasPermission';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

const subscriptionOptions = {
	projection: {
		blocked: 1,
		blocker: 1,
	},
};

async function validateRoomMessagePermissionsAsync(
	room: IRoom | null,
	{ uid, username, type }: { uid: IUser['_id']; username: IUser['username']; type: IUser['type'] },
	extraData: Record<string, any>,
): Promise<void> {
	if (!room) {
		throw new Error('error-invalid-room');
	}

	if (type !== 'app' && !(await canAccessRoomAsync(room, { _id: uid }, extraData))) {
		throw new Error('error-not-allowed');
	}

	if (roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.BLOCK)) {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, uid, subscriptionOptions);
		if (subscription && (subscription.blocked || subscription.blocker)) {
			throw new Error('room_is_blocked');
		}
	}

	if (room.ro === true && !(await hasPermissionAsync(uid, 'post-readonly', room._id))) {
		// Unless the user was manually unmuted
		if (username && !(room.unmuted || []).includes(username)) {
			throw new Error("You can't send messages because the room is readonly.");
		}
	}

	if (username && room?.muted?.includes(username)) {
		throw new Error('You_have_been_muted');
	}
}

export async function canSendMessageAsync(
	rid: IRoom['_id'],
	{ uid, username, type }: { uid: IUser['_id']; username: IUser['username']; type: IUser['type'] },
	extraData: Record<string, any>,
): Promise<IRoom> {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Error('error-invalid-room');
	}

	await validateRoomMessagePermissionsAsync(room, { uid, username, type }, extraData);
	return room;
}

export function canSendMessage(
	rid: IRoom['_id'],
	{ uid, username, type }: { uid: IUser['_id']; username: IUser['username']; type: IUser['type'] },
	extraData: Record<string, any>,
): IRoom {
	return Promise.await(canSendMessageAsync(rid, { uid, username, type }, extraData));
}
export function validateRoomMessagePermissions(
	room: IRoom,
	{ uid, username, type }: { uid: IUser['_id']; username: IUser['username']; type: IUser['type'] },
	extraData: Record<string, any>,
): void {
	return Promise.await(validateRoomMessagePermissionsAsync(room, { uid, username, type }, extraData));
}
