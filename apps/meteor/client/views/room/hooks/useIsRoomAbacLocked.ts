import { useSetting } from '@rocket.chat/ui-contexts';

import { useIsAbacEnforcementOn } from './useIsAbacEnforcementOn';
import type { AbacLockableRoom } from '../../../../lib/rooms/isRoomAbacLocked';
import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';

const NO_REQUIRED_ATTRIBUTE_KEYS: string[] = [];

export const useIsRoomAbacLocked = (room?: AbacLockableRoom): boolean => {
	const enforcementOn = useIsAbacEnforcementOn();
	const requiredAttributeKeys = useSetting('ABAC_Required_Attributes', NO_REQUIRED_ATTRIBUTE_KEYS);

	if (!room) {
		return false;
	}

	return isRoomAbacLocked(room, { enforcementOn, requiredAttributeKeys });
};
