import type { IRoom } from '@rocket.chat/core-typings';
import { isDiscussion, isPrivateRoom, isRoomFederated, isRoomXMPPFederated } from '@rocket.chat/core-typings';

import { useIsAbacEnforcementOn } from './useIsAbacEnforcementOn';
import { useRoomAbacInfo } from './useRoomAbacInfo';
import type { AbacLockableRoom } from '../../../../lib/rooms/isRoomAbacLocked';
import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';

export const useIsRoomAbacLocked = (rid: IRoom['_id'], room?: AbacLockableRoom): boolean => {
	const enforcementOn = useIsAbacEnforcementOn();
	const needsRequiredKeys =
		enforcementOn &&
		!!room &&
		!isRoomFederated(room) &&
		!isRoomXMPPFederated(room) &&
		!isDiscussion(room) &&
		isPrivateRoom(room) &&
		!!room.abacAttributes?.length;
	const { data: requiredAttributeKeys } = useRoomAbacInfo(rid, room?.abacAttributes, {
		enabled: needsRequiredKeys,
		select: (data) => data.abacRequiredAttributes ?? [],
	});

	if (!room || (needsRequiredKeys && !requiredAttributeKeys)) {
		return false;
	}

	return isRoomAbacLocked(room, { enforcementOn, requiredAttributeKeys: requiredAttributeKeys ?? [] });
};
