import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo, useCallback } from 'react';

import OTR from '../../app/otr/client/OTR';
import type { OTRRoom } from '../../app/otr/client/OTRRoom';
import { OtrRoomState } from '../../app/otr/lib/OtrRoomState';
import { useRoom } from '../views/room/contexts/RoomContext';
import { useReactiveValue } from './useReactiveValue';

export const useOTR = (): { otr: OTRRoom | undefined; otrState: OtrRoomState } => {
	const uid = useUserId();
	const room = useRoom();

	const otr = useMemo(() => {
		if (!uid || !room) {
			return;
		}

		return OTR.getInstanceByRoomId(uid, room._id);
	}, [uid, room]);

	const otrState = useReactiveValue(useCallback(() => (otr ? otr.getState() : OtrRoomState.ERROR), [otr]));

	return {
		otr,
		otrState,
	};
};
