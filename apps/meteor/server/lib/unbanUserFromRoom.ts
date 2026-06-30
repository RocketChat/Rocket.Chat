import { Rooms, Users } from '@rocket.chat/models';

import { roomCoordinator } from './rooms/roomCoordinator';
import { canAccessRoomAsync } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { executeUnbanUserFromRoom } from '../../app/lib/server/functions/executeUnbanUserFromRoom';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';

export const unbanUserFromRoom = async (fromId: string, data: { rid: string; username: string }): Promise<boolean> => {
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

	await executeUnbanUserFromRoom(data.rid, bannedUser, fromUser);

	return true;
};
