import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IRoom, IRoomWithJoinCode, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Rooms, Users } from '@rocket.chat/models';

import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { addUserToRoom } from '../functions';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		joinRoom(rid: IRoom['_id'], code?: unknown): boolean | undefined;
	}
}

export const joinRoomMethod = async (userId: IUser['_id'], rid: IRoom['_id'], code?: unknown): Promise<boolean | undefined> => {
	check(rid, String);

	const user = await Users.findOneById(userId);

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
	}

	const room = await Rooms.findOneById<IRoomWithJoinCode>(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
	}

	if (!(await roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.JOIN, user._id))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
	}

	if (!(await canAccessRoomAsync(room, user))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
	}
	if (room.joinCodeRequired === true && code !== room.joinCode && !(await hasPermissionAsync(user._id, 'join-without-join-code'))) {
		throw new Meteor.Error('error-code-invalid', 'Invalid Room Password', {
			method: 'joinRoom',
		});
	}

	return addUserToRoom(rid, user);
};

Meteor.methods<ServerMethods>({
	async joinRoom(rid, code) {
		check(rid, String);

		const userId = await Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		return joinRoomMethod(userId, rid, code);
	},
});
