import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { isDiscussion, isPrivateRoom, isPublicRoom, isRoomFederated } from '@rocket.chat/core-typings';

export type AbacLockableRoom = Pick<IRoom, 't' | 'abacAttributes' | 'federated' | 'prid'>;

export type RoomAbacLockContext = {
	enforcementOn: boolean;
	requiredAttributeKeys: string[];
};

export const isRoomAbacLocked = (room: AbacLockableRoom, { enforcementOn, requiredAttributeKeys }: RoomAbacLockContext): boolean => {
	if (!enforcementOn) {
		return false;
	}

	if (isRoomFederated(room)) {
		return false;
	}

	// Enforcement holds `Discussion_enabled` at false, so a discussion that predates it stays locked
	// whatever it carries.
	if (isDiscussion(room)) {
		return true;
	}

	if (isPublicRoom(room)) {
		return true;
	}

	if (!isPrivateRoom(room)) {
		return false;
	}

	const attributes: IAbacAttributeDefinition[] = Array.isArray(room.abacAttributes) ? room.abacAttributes : [];

	if (attributes.length === 0) {
		return true;
	}

	const presentKeys = new Set(attributes.filter((attribute) => attribute.values?.length > 0).map((attribute) => attribute.key));

	return requiredAttributeKeys.some((requiredKey) => {
		const key = requiredKey.trim();
		return key.length > 0 && !presentKeys.has(key);
	});
};
