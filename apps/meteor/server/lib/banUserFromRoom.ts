import { isBannedSubscription } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users, Roles } from '@rocket.chat/models';

import { roomCoordinator } from './rooms/roomCoordinator';
import { canAccessRoomAsync } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../app/authorization/server/functions/hasRole';
import { banUserFromRoom } from '../../app/lib/server/functions/banUserFromRoom';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';

export const banUserFromRoomMethod = async (fromId: string, data: { rid: string; username: string }): Promise<boolean> => {
	if (!(await hasPermissionAsync(fromId, 'ban-user', data.rid))) {
		throw new Error('Not allowed');
	}

	const room = await Rooms.findOneById(data.rid);

	if (!room || !(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.BAN, fromId))) {
		throw new Error('Not allowed');
	}

	const fromUser = await Users.findOneById(fromId);
	if (!fromUser) {
		throw new Error('Invalid user');
	}

	if (!(await canAccessRoomAsync(room, fromUser))) {
		throw new Error('The required "roomId" or "roomName" param provided does not match any group');
	}

	const bannedUser = await Users.findOneByUsernameIgnoringCase(data.username);
	if (!bannedUser) {
		throw new Error('User not found');
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(data.rid, bannedUser._id, {
		projection: { _id: 1, status: 1 },
	});
	if (!subscription) {
		throw new Error('User is not in this room');
	}

	// Cannot ban a user who is already banned
	if (isBannedSubscription(subscription)) {
		throw new Error('User is already banned from this room');
	}

	// Cannot ban the last owner
	if (await hasRoleAsync(bannedUser._id, 'owner', room._id)) {
		const numOwners = await Roles.countUsersInRole('owner', room._id);

		if (numOwners === 1) {
			throw new Error('You are the last owner. Please set new owner before banning the user.');
		}
	}

	await banUserFromRoom(data.rid, bannedUser, fromUser);

	return true;
};
