import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { notifyOnSubscriptionChangedByRoomIdAndUserIds } from '../lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		blockUser({ rid, blocked }: { rid: string; blocked: string }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async blockUser({ rid, blocked }) {
		check(rid, String);
		check(blocked, String);
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		const room = await Rooms.findOne({ _id: rid });

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.BLOCK, userId))) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		const [blockedUser, blockerUser] = await Promise.all([
			Subscriptions.findOneByRoomIdAndUserId(rid, blocked, { projection: { _id: 1 } }),
			Subscriptions.findOneByRoomIdAndUserId(rid, userId, { projection: { _id: 1 } }),
		]);

		if (!blockedUser || !blockerUser) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		const [blockedResponse, blockerResponse] = await Subscriptions.setBlockedByRoomId(rid, blocked, userId);

		const listenerUsers = [...(blockedResponse?.modifiedCount ? [blocked] : []), ...(blockerResponse?.modifiedCount ? [userId] : [])];

		if (listenerUsers.length) {
			void notifyOnSubscriptionChangedByRoomIdAndUserIds(rid, listenerUsers);
		}

		return true;
	},
});
