import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

export const useIsRoomActive = (room: IOmnichannelRoom) => {
	// @ts-ignore
	const { activity = [] } = room.v; // TODO: add activity to IOmnichannelRoom['v']
	const isContactActive = useMemo(() => {
		const date = new Date();
		const currentPeriod = `${date.getFullYear()}-${date.getMonth() + 1}`;
		return activity.includes(currentPeriod);
	}, [activity]);

	return isContactActive;
};
