import type { IRoom } from '@rocket.chat/core-typings';
import { type IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { useIsOverMacLimit } from './useIsOverMacLimit';

const getPeriod = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const useIsRoomOverMacLimit = (room: IRoom) => {
	const isOverMacLimit = useIsOverMacLimit();
	const { v: { activity = [] } = {}, t: roomType, open } = room as IOmnichannelGenericRoom;

	const isContactActive = useMemo(() => {
		if (!['l', 'v'].includes(roomType) || !open) {
			return true;
		}

		const currentPeriod = getPeriod(new Date());
		return !isOverMacLimit || activity.includes(currentPeriod);
	}, [activity, isOverMacLimit, open, roomType]);

	return !isContactActive;
};
