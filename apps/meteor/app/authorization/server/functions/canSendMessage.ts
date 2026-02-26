import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms } from '@rocket.chat/models';

import { canAccessRoomAsync } from './canAccessRoom';
import { hasPermissionAsync } from './hasPermission';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

const subscriptionOptions = {
	projection: {
		blocked: 1,
		blocker: 1,
	},
};

// TODO: remove option uid and username and type
export async function validateRoomMessagePermissionsAsync(
	room: IRoom | null,
	args: { uid: IUser['_id']; username: IUser['username']; type: IUser['type'] } | IUser,
	extraData?: Record<string, any>,
): Promise<void> {
	if (!room) {
		throw new Error('error-invalid-room');
	}

	if (room.archived) {
		throw new Error('room_is_archived');
	}
	if (args.type !== 'app' && !(await canAccessRoomAsync(room, 'uid' in args ? { _id: args.uid } : args, extraData))) {
		throw new Error('error-not-allowed');
	}

	if (
		await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.BLOCK, 'uid' in args ? args.uid : args._id)
	) {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, 'uid' in args ? args.uid : args._id, subscriptionOptions);
		if (subscription && (subscription.blocked || subscription.blocker)) {
			throw new Error('room_is_blocked');
		}
	}

	if (room.ro === true && !(await hasPermissionAsync('uid' in args ? args.uid : args._id, 'post-readonly', room._id))) {
		// Unless the user was manually unmuted
		if (args.username && !(room.unmuted || []).includes(args.username)) {
			throw new Error("You can't send messages because the room is readonly.");
		}
	}

	if (args.username && room?.muted?.includes(args.username)) {
		throw new Error('You_have_been_muted');
	}
}
// TODO: remove option uid and username and type
export async function canSendMessageAsync(
	rid: IRoom['_id'],
	user: { uid: IUser['_id']; username: IUser['username']; type: IUser['type'] } | IUser,
	extraData?: Record<string, any>,
): Promise<IRoom> {
	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Error('error-invalid-room');
	}

	await validateRoomMessagePermissionsAsync(room, user, extraData);
	return room;
}
