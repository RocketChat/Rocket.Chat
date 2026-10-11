import type { IRoom } from '@rocket.chat/core-typings';

import { useIsAbacEnforcementOn } from './useIsAbacEnforcementOn';
import { useRoomAbacInfo } from './useRoomAbacInfo';
import type { AbacLockableRoom } from '../../../../lib/rooms/isRoomAbacLocked';
import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';

export const useIsRoomAbacLocked = (rid: IRoom['_id'], room?: AbacLockableRoom): boolean => {
	const enforcementOn = useIsAbacEnforcementOn();
	const { data: requiredAttributeKeys } = useRoomAbacInfo(rid, room?.abacAttributes, (data) => data.abacRequiredAttributes ?? []);

	if (!room || !requiredAttributeKeys) {
		return false;
	}

	return isRoomAbacLocked(room, { enforcementOn, requiredAttributeKeys });
};
