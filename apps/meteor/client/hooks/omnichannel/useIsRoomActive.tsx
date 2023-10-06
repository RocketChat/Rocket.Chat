import type { IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { useIsOverMacLimit } from './useIsOverMacLimit';

const getPeriod = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const useIsRoomActive = (room: IOmnichannelGenericRoom) => {
	const isOverMacLimit = useIsOverMacLimit();
	const { activity = [] } = room.v;

	const isContactActive = useMemo(() => {
		const currentPeriod = getPeriod(new Date());
		return !isOverMacLimit || activity.includes(currentPeriod);
	}, [activity, isOverMacLimit]);

	return isContactActive;
};
