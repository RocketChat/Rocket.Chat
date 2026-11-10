import type { IRoom } from '@rocket.chat/core-typings';
import { isDiscussion, isPrivateRoom, isPublicRoom, isRoomFederated, isRoomXMPPFederated } from '@rocket.chat/core-typings';

export type AbacLockableRoom = Pick<IRoom, 't' | 'abacAttributes' | 'federated' | 'xmppFederation' | 'prid'>;

export type RoomAbacLockContext = {
	enforcementOn: boolean;
	requiredAttributeKeys: string[];
};

export const isRoomAbacLocked = (room: AbacLockableRoom, { enforcementOn, requiredAttributeKeys }: RoomAbacLockContext): boolean => {
	if (!enforcementOn) {
		return false;
	}

	if (isRoomFederated(room) || isRoomXMPPFederated(room)) {
		return false;
	}

	if (isDiscussion(room)) {
		return true;
	}

	if (isPublicRoom(room)) {
		return true;
	}

	if (!isPrivateRoom(room)) {
		return false;
	}

	const presentKeys = room.abacAttributes?.filter(({ values }) => values.length > 0).map(({ key }) => key) ?? [];

	if (!presentKeys.length) {
		return true;
	}

	return requiredAttributeKeys.some((key) => !presentKeys.includes(key));
};
