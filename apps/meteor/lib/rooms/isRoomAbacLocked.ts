import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { isPrivateRoom, isPublicRoom, isRoomFederated } from '@rocket.chat/core-typings';

export type AbacLockableRoom = Pick<IRoom, 't' | 'abacAttributes' | 'federated'>;

export type RoomAbacLockContext = {
	/** `ABAC_Enabled` and `ABAC_Enforce_All_Rooms`, both. */
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

	// Federated rooms are never ABAC-enforced, since remote members cannot be evaluated against the
	// PDP (ABAC-P4/D8). Checked first because it outranks every rule below.
	if (isRoomFederated(room)) {
		return false;
	}

	// ABAC-P4/D6 — enforcement forces ABAC-managed on, which forces Private on, so a public channel
	// is outside the boundary whatever it carries.
	if (isPublicRoom(room)) {
		return true;
	}

	// Direct messages are governed by organizational policy rather than enforcement (ABAC-P4/D1),
	// and Omnichannel is out of scope. A whitelist, so a room type added later stays unlocked until
	// someone decides it should not be.
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
