import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { isPrivateRoom, isPublicRoom, isRoomFederated } from '@rocket.chat/core-typings';

export type AbacLockableRoom = Pick<IRoom, 't' | 'abacAttributes' | 'federated'>;

export type RoomAbacLockContext = {
	enforcementOn: boolean;
	requiredAttributeKeys: string[];
};

/**
 * Not the negation of `isABACManagedRoom`, which requires `t === 'p'`: a public channel created
 * before enforcement is never "managed" and is exactly what enforcement must lock.
 */
export const isRoomAbacLocked = (room: AbacLockableRoom, { enforcementOn, requiredAttributeKeys }: RoomAbacLockContext): boolean => {
	if (!enforcementOn) {
		return false;
	}

	// Remote members cannot be evaluated against the PDP, so federated rooms are never enforced.
	if (isRoomFederated(room)) {
		return false;
	}

	if (isPublicRoom(room)) {
		return true;
	}

	// A whitelist, so a room type added later stays unlocked until someone decides it should not be.
	// Direct messages and Omnichannel are intentionally outside enforcement.
	if (!isPrivateRoom(room)) {
		return false;
	}

	const attributes: IAbacAttributeDefinition[] = Array.isArray(room.abacAttributes) ? room.abacAttributes : [];

	if (attributes.length === 0) {
		return true;
	}

	// Trimmed but not case-folded, matching `validateAndNormalizeAttributes`.
	const presentKeys = new Set(attributes.filter((attribute) => attribute.values?.length > 0).map((attribute) => attribute.key));

	return requiredAttributeKeys.some((requiredKey) => {
		const key = requiredKey.trim();
		return key.length > 0 && !presentKeys.has(key);
	});
};
