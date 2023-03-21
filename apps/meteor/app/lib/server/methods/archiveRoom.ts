import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Rooms } from '../../../models/server';
import { hasPermission } from '../../../authorization/server';
import { archiveRoom } from '../functions';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		archiveRoom(rid: string): void;
	}
}

Meteor.methods<ServerMethods>({
	archiveRoom(rid) {
		check(rid, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'archiveRoom' });
		}

		if (!roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.ARCHIVE, userId)) {
			throw new Meteor.Error('error-direct-message-room', `rooms type: ${room.t} can not be archived`, { method: 'archiveRoom' });
		}

		if (!hasPermission(userId, 'archive-room', room._id)) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'archiveRoom' });
		}

		return archiveRoom(rid);
	},
});
