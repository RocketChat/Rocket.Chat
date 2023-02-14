import type { IMessage } from '@rocket.chat/core-typings';
import { differenceInSeconds } from 'date-fns';

import { MessageTypes } from '../../../../../app/ui-utils/lib/MessageTypes';
import { isMessageNewDay } from './isMessageNewDay';

export const isMessageSequential = (current: IMessage, previous: IMessage | undefined, groupingRange: number): boolean => {
	if (!previous) {
		return false;
	}

	if (MessageTypes.isSystemMessage(current) || MessageTypes.isSystemMessage(previous)) {
		return false;
	}

	if (current.tmid) {
		return [previous.tmid, previous._id].includes(current.tmid);
	}

	if (previous.tmid) {
		return false;
	}

	if (current.groupable === false) {
		return false;
	}

	if (current.u._id !== previous.u._id) {
		return false;
	}

	if (current.alias !== previous.alias) {
		return false;
	}
	return differenceInSeconds(current.ts, previous.ts) < groupingRange && !isMessageNewDay(current, previous);
};
