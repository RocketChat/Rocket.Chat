import type { LockableRoom } from '@rocket.chat/core-typings';
import { isRoomLocked } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

import { useIsAbacEnforcementOn } from './useIsAbacEnforcementOn';

/**
 * Client-side read of the shared `isRoomLocked` predicate (ABAC-P4 §7.1). Calls exactly the same
 * function the server guards call — the composer state is an affordance, never the enforcement.
 */
export const useIsRoomLocked = (room: LockableRoom | undefined): boolean => {
	const enforcementOn = useIsAbacEnforcementOn();
	const requiredAttributeKeys = useSetting<string[]>('ABAC_Required_Attributes', []);

	if (!room) {
		return false;
	}

	return isRoomLocked(room, {
		enforcementOn,
		requiredAttributeKeys: requiredAttributeKeys ?? [],
	});
};
