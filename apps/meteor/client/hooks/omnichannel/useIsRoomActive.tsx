import type { IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

const getPeriod = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const useIsRoomActive = (room: IOmnichannelGenericRoom) => {
	const { activity = [] } = room.v;

	const isContactActive = useMemo(() => {
		const currentPeriod = getPeriod(new Date());
		return activity.includes(currentPeriod);
	}, [activity]);

	return isContactActive;
};
