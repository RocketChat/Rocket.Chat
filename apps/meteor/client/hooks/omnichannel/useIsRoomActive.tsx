import type { IRoom } from '@rocket.chat/core-typings';
import { type IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { useIsOverMacLimit } from './useIsOverMacLimit';

const getPeriod = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const useIsRoomActive = (room: IRoom) => {
	const isOverMacLimit = useIsOverMacLimit();
	const { v: { activity = [] } = {}, t: roomType } = room as IOmnichannelGenericRoom;

	const isContactActive = useMemo(() => {
		if (!['l', 'v'].includes(roomType)) {
			return true;
		}

		const currentPeriod = getPeriod(new Date());
		return !isOverMacLimit || activity.includes(currentPeriod);
	}, [activity, isOverMacLimit, roomType]);

	return isContactActive;
};
