import { useAbacConfigQuery } from './useAbacConfigQuery';
import { useIsAbacEnforcementOn } from './useIsAbacEnforcementOn';
import type { AbacLockableRoom } from '../../../../lib/rooms/isRoomAbacLocked';
import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';

const NO_REQUIRED_ATTRIBUTE_KEYS: string[] = [];

export const useIsRoomAbacLocked = (room?: AbacLockableRoom): boolean => {
	const enforcementOn = useIsAbacEnforcementOn();
	const { data: abacConfig } = useAbacConfigQuery();
	const requiredAttributeKeys = abacConfig?.requiredAttributes ?? NO_REQUIRED_ATTRIBUTE_KEYS;

	if (!room) {
		return false;
	}

	return isRoomAbacLocked(room, { enforcementOn, requiredAttributeKeys });
};
