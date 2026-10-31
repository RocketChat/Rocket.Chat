import { ClientSafeError } from '@rocket.chat/core-services';
import { Subscriptions, Rooms } from '@rocket.chat/models';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { notifyOnSubscriptionChangedByRoomIdAndUserIds } from '../notifyListener';
import { roomCoordinator } from '../rooms/roomCoordinator';

export const blockUserMethod = async (userId: string, { rid, blocked }: { rid: string; blocked: string }): Promise<void> => {
	const room = await Rooms.findOne({ _id: rid });

	if (!room) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'blockUser' });
	}

	if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.BLOCK, userId))) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'blockUser' });
	}

	const [blockedUser, blockerUser] = await Promise.all([
		Subscriptions.findOneByRoomIdAndUserId(rid, blocked, { projection: { _id: 1 } }),
		Subscriptions.findOneByRoomIdAndUserId(rid, userId, { projection: { _id: 1 } }),
	]);

	if (!blockedUser || !blockerUser) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'blockUser' });
	}

	const [blockedResponse, blockerResponse] = await Subscriptions.setBlockedByRoomId(rid, blocked, userId);

	const listenerUsers = [...(blockedResponse?.modifiedCount ? [blocked] : []), ...(blockerResponse?.modifiedCount ? [userId] : [])];

	if (listenerUsers.length) {
		void notifyOnSubscriptionChangedByRoomIdAndUserIds(rid, listenerUsers);
	}
};
