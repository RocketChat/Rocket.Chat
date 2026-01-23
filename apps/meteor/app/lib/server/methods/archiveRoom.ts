import { isRegisterUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { archiveRoom } from '../functions/archiveRoom';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		archiveRoom(rid: string): Promise<void>;
	}
}

export const executeArchiveRoom = async (userId: string, rid: string) => {
	check(rid, String);

	const user = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
	if (!user || !isRegisterUser(user)) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
	}

	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'archiveRoom' });
	}

	if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.ARCHIVE, userId))) {
		throw new Meteor.Error('error-direct-message-room', `rooms type: ${room.t} can not be archived`, { method: 'archiveRoom' });
	}

	if (!(await hasPermissionAsync(userId, 'archive-room', room._id))) {
		throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'archiveRoom' });
	}

	return archiveRoom(rid, user);
};

Meteor.methods<ServerMethods>({
	async archiveRoom(rid) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		return executeArchiveRoom(userId, rid);
	},
});
