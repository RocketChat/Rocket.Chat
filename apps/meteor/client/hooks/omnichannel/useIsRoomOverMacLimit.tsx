import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, type IOmnichannelGenericRoom, isVoipRoom } from '@rocket.chat/core-typings';

import { useIsOverMacLimit } from './useIsOverMacLimit';

const getPeriod = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const useIsRoomOverMacLimit = (room: IRoom) => {
	const isOverMacLimit = useIsOverMacLimit();

	if (!isOmnichannelRoom(room) && !isVoipRoom(room)) {
		return false;
	}

	if (room.closedAt) {
		return false;
	}

	const { v: { activity = [] } = {} } = room as IOmnichannelGenericRoom;

	const currentPeriod = getPeriod(new Date());
	return isOverMacLimit && !activity.includes(currentPeriod);
};
