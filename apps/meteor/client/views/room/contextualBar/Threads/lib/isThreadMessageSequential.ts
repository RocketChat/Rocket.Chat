import type { IMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { differenceInSeconds } from 'date-fns/differenceInSeconds';

import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';

/** Whether a thread message is shown grouped under the one before it, as the thread's message list groups them. */
export const isThreadMessageSequential = (current: IMessage, previous: IMessage | undefined, groupingRange: number): boolean => {
	if (!previous) {
		return false;
	}

	if (MessageTypes.isSystemMessage(current) || MessageTypes.isSystemMessage(previous)) {
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
