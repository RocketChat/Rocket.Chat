import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms as RoomsRaw, Users as UsersRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { roomCoordinator } from './rooms/roomCoordinator';
import { callbacks } from '../../lib/callbacks';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';
import { Messages, Rooms, Subscriptions, Users } from '../../app/models/server';

export async function unmuteUserInRoom(
	roomId: IRoom['_id'],
	executorId: IUser['_id'],
	userIdOrUsername: NonNullable<IUser['_id']> | NonNullable<IUser['username']>,
): Promise<boolean> {
	const fromUser = await UsersRaw.findOneById(executorId);

	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid executor user id', {
			method: 'unmuteUserInRoom',
		});
	}

	if (!(await hasPermissionAsync(executorId, 'mute-user', roomId))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'unmuteUserInRoom',
		});
	}

	const room = await RoomsRaw.findOneById(roomId);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'unmuteUserInRoom',
		});
	}

	if (!roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.MUTE)) {
		throw new Meteor.Error('error-invalid-room-type', `${room.t} is not a valid room type`, {
			method: 'unmuteUserInRoom',
			type: room.t,
		});
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, userIdOrUsername, {
		fields: { _id: 1 },
	});
	if (!subscription) {
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
			method: 'unmuteUserInRoom',
		});
	}

	const unmutedUser = (await UsersRaw.findOneById(userIdOrUsername)) || Users.findOneByUsernameIgnoringCase(userIdOrUsername);
	if (!unmutedUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid executor user id', {
			method: 'unmuteUserInRoom',
		});
	}

	// @ts-ignore
	callbacks.run('beforeUnmuteUser', { unmutedUser, fromUser }, room);

	Rooms.unmuteUsernameByRoomId(roomId, unmutedUser.username);

	Messages.createUserUnmutedWithRoomIdAndUser(roomId, unmutedUser, {
		u: {
			_id: fromUser._id,
			username: fromUser.username,
		},
	});

	// @ts-ignore
	callbacks.run('afterUnmuteUser', { mutedUser: unmutedUser, fromUser }, room);

	return true;
}
